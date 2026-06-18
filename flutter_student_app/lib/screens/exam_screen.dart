import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'dart:math';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'package:camera/camera.dart';
import 'package:google_mlkit_face_detection/google_mlkit_face_detection.dart';
import 'package:flutter/foundation.dart';
import '../services/api_service.dart';

class ExamScreen extends StatefulWidget {
  final String examId;
  const ExamScreen({super.key, required this.examId});

  @override
  State<ExamScreen> createState() => _ExamScreenState();
}

class _ExamScreenState extends State<ExamScreen> with WidgetsBindingObserver {
  Map<String, dynamic>? _exam;
  String? _paperId;
  bool _loading = true;
  bool _examStarted = false;
  int _currentIndex = 0;
  final Map<String, dynamic> _selectedAnswers = {};
  int _timeLeft = 0;
  Timer? _timer;
  int _violations = 0;
  int _trustScore = 100;

  CameraController? _cameraController;
  FaceDetector? _faceDetector;
  bool _isCameraInitialized = false;
  bool _isProcessingFrame = false;
  DateTime? _lastProcessedTime;
  double? _lastFaceX;
  double? _lastFaceY;
  int _noFaceFrameCount = 0;
  int _multiFaceFrameCount = 0;
  bool _showCameraPreview = true;
  bool _isCameraFrameRed = false;
  Timer? _cameraRedBorderTimer;
  bool _isCameraViolationActive = false;
  Timer? _proctoringSyncTimer;

  bool get _isCameraFrameBorderRed => _isCameraFrameRed || _isCameraViolationActive;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    _fetchExam();
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    _timer?.cancel();
    _proctoringSyncTimer?.cancel();
    _cameraRedBorderTimer?.cancel();
    _cameraController?.dispose();
    _faceDetector?.close();
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (_examStarted && (state == AppLifecycleState.paused || state == AppLifecycleState.inactive)) {
      _recordViolation('tab_switch', 'App went to background');
    }
  }

  Future<void> _fetchExam() async {
    try {
      final api = Provider.of<ApiService>(context, listen: false);
      final data = await api.get('/exam/${widget.examId}');
      setState(() {
        _exam = data['exam'];
        _timeLeft = (data['exam']['timeLimit'] ?? 30) * 60;
        _loading = false;
      });
    } catch (e) {
      setState(() => _loading = false);
    }
  }

  Future<void> _startExam() async {
    final isCamera = _exam!['proctoring']?['cameraEnabled'] == true;
    if (isCamera) {
      final cameraSuccess = await _initializeProctoringCamera();
      if (!cameraSuccess) return;
    }

    try {
      final api = Provider.of<ApiService>(context, listen: false);
      final data = await api.post('/paper/session/${widget.examId}', {
        'browserInfo': 'Flutter App',
      });
      setState(() {
        _paperId = data['paper']['_id'];
        _examStarted = true;
      });
      _startTimer();
      if (isCamera) {
        _startProctoringSync();
      }
      // Lock orientation
      SystemChrome.setPreferredOrientations([DeviceOrientation.portraitUp]);
      // Hide system UI
      SystemChrome.setEnabledSystemUIMode(SystemUiMode.immersiveSticky);
    } catch (e) {
      _cameraController?.dispose();
      _cameraController = null;
      _faceDetector?.close();
      _faceDetector = null;
      setState(() {
        _isCameraInitialized = false;
      });

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(e.toString().replaceAll('Exception: ', '')),
          backgroundColor: Colors.red,
          behavior: SnackBarBehavior.floating,
        ),
      );
    }
  }

  Future<bool> _initializeProctoringCamera() async {
    try {
      final cameras = await availableCameras();
      final frontCamera = cameras.firstWhere(
        (cam) => cam.lensDirection == CameraLensDirection.front,
        orElse: () => cameras.first,
      );

      _cameraController = CameraController(
        frontCamera,
        ResolutionPreset.medium,
        enableAudio: false,
        imageFormatGroup: Platform.isAndroid
            ? ImageFormatGroup.nv21
            : ImageFormatGroup.bgra8888,
      );

      await _cameraController!.initialize();
      
      _faceDetector = FaceDetector(
        options: FaceDetectorOptions(
          enableContours: false,
          enableClassification: false,
          performanceMode: FaceDetectorMode.accurate,
        ),
      );

      setState(() {
        _isCameraInitialized = true;
      });

      // Start processing frame stream
      await _cameraController!.startImageStream((CameraImage image) {
        _processCameraImage(image);
      });
      
      return true;
    } catch (e) {
      debugPrint('Camera Initialization Error: $e');
      if (mounted) {
        showDialog(
          context: context,
          builder: (ctx) => AlertDialog(
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
            title: const Text('Camera Permission Required', style: TextStyle(fontWeight: FontWeight.bold)),
            content: const Text(
              'This exam is AI-proctored and requires camera access to monitor your session. '
              'Please grant camera permission in your app settings to proceed.'
            ),
            actions: [
              TextButton(
                onPressed: () => Navigator.pop(ctx),
                child: const Text('OK', style: TextStyle(fontWeight: FontWeight.bold)),
              ),
            ],
          ),
        );
      }
      return false;
    }
  }

  void _processCameraImage(CameraImage image) async {
    final now = DateTime.now();
    if (_isProcessingFrame) return;
    // Throttle to 1 frame per 2000 milliseconds (0.5 FPS, matches web client local check)
    if (_lastProcessedTime != null && now.difference(_lastProcessedTime!).inMilliseconds < 2000) {
      return;
    }
    _isProcessingFrame = true;
    _lastProcessedTime = now;

    try {
      final inputImage = _inputImageFromCameraImage(image);
      if (inputImage == null || _faceDetector == null) return;

      final List<Face> faces = await _faceDetector!.processImage(inputImage);
      
      if (faces.isEmpty) {
        _noFaceFrameCount++;
        _multiFaceFrameCount = 0;
      } else if (faces.length > 1) {
        _multiFaceFrameCount++;
        _noFaceFrameCount = 0;
      } else {
        // Exactly one face detected
        _noFaceFrameCount = 0;
        _multiFaceFrameCount = 0;
        
        final Face face = faces.first;
        final rect = face.boundingBox;
        final cx = rect.left + rect.width / 2;
        final cy = rect.top + rect.height / 2;

        if (_lastFaceX != null && _lastFaceY != null) {
          final dx = cx - _lastFaceX!;
          final dy = cy - _lastFaceY!;
          final distance = sqrt(dx * dx + dy * dy);

          // If the face moves more than 85 pixels, detect as movement violation
          if (distance > 85.0) {
            _recordViolation('excessive_movement', 'Excessive movement detected');
          }
        }
        _lastFaceX = cx;
        _lastFaceY = cy;
      }

      // Update camera violation state (active if threshold is met)
      if (mounted) {
        setState(() {
          _isCameraViolationActive = _noFaceFrameCount >= 3 || _multiFaceFrameCount >= 2;
        });
      }
    } catch (e) {
      debugPrint('Error running face detection: $e');
    } finally {
      _isProcessingFrame = false;
    }
  }

  InputImage? _inputImageFromCameraImage(CameraImage image) {
    if (_cameraController == null) return null;

    final camera = _cameraController!.description;
    final sensorOrientation = camera.sensorOrientation;
    
    // Rotation mapping
    final InputImageRotation rotation = InputImageRotationValue.fromRawValue(sensorOrientation) ?? InputImageRotation.rotation0deg;

    // Format mapping
    InputImageFormat? format = InputImageFormatValue.fromRawValue(image.format.raw);
    if (format == null || format == InputImageFormat.yuv420) {
      if (Platform.isAndroid) {
        format = InputImageFormat.nv21;
      } else if (Platform.isIOS) {
        format = InputImageFormat.bgra8888;
      }
    }
    if (format == null) return null;

    final WriteBuffer allBytes = WriteBuffer();
    for (final Plane plane in image.planes) {
      allBytes.putUint8List(plane.bytes);
    }
    final bytes = allBytes.done().buffer.asUint8List();

    final plane = image.planes.first;

    return InputImage.fromBytes(
      bytes: bytes,
      metadata: InputImageMetadata(
        size: Size(image.width.toDouble(), image.height.toDouble()),
        rotation: rotation,
        format: format,
        bytesPerRow: plane.bytesPerRow,
      ),
    );
  }

  Widget _buildCameraPreviewOverlay() {
    return Container(
      width: 100,
      height: 130,
      decoration: BoxDecoration(
        color: Colors.black,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: _isCameraFrameBorderRed ? Colors.red : Colors.white,
          width: 2,
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.25),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(14),
        child: Stack(
          children: [
            CameraPreview(_cameraController!),
            // LIVE badge
            Positioned(
              top: 6,
              left: 6,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 3),
                decoration: BoxDecoration(
                  color: Colors.red.withValues(alpha: 0.85),
                  borderRadius: BorderRadius.circular(4),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const _CameraLiveDot(),
                    const SizedBox(width: 4),
                    const Text(
                      'LIVE',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 8,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ],
                ),
              ),
            ),
            // Minimize button
            Positioned(
              top: 6,
              right: 6,
              child: GestureDetector(
                onTap: () => setState(() => _showCameraPreview = false),
                child: Container(
                  padding: const EdgeInsets.all(4),
                  decoration: BoxDecoration(
                    color: Colors.black.withValues(alpha: 0.5),
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(
                    Icons.close,
                    color: Colors.white,
                    size: 10,
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildMinimizedCameraOverlay() {
    return GestureDetector(
      onTap: () => setState(() => _showCameraPreview = true),
      child: Container(
        width: 44,
        height: 44,
        decoration: BoxDecoration(
          color: const Color(0xFF1E3A8A),
          shape: BoxShape.circle,
          border: Border.all(
            color: _isCameraFrameBorderRed ? Colors.red : Colors.white,
            width: 2,
          ),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.25),
              blurRadius: 8,
              offset: const Offset(0, 3),
            ),
          ],
        ),
        child: Stack(
          alignment: Alignment.center,
          children: [
            const Icon(
              Icons.videocam_outlined,
              color: Colors.white,
              size: 20,
            ),
            Positioned(
              top: 8,
              right: 8,
              child: Container(
                width: 6,
                height: 6,
                decoration: const BoxDecoration(
                  color: Colors.red,
                  shape: BoxShape.circle,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _startTimer() {
    _timer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (_timeLeft <= 0) {
        _autoSubmit('Time limit exceeded');
        return;
      }
      setState(() => _timeLeft--);
    });
  }

  void _startProctoringSync() {
    _proctoringSyncTimer?.cancel();
    final intervalSeconds = _exam?['proctoring']?['cameraIntervalSeconds'] ?? 10;
    _proctoringSyncTimer = Timer.periodic(Duration(seconds: intervalSeconds), (timer) {
      _syncProctoringViolation();
    });
  }

  void _syncProctoringViolation() {
    if (!_examStarted || _paperId == null) return;
    _captureAndUploadSnapshot();
  }

  Future<void> _captureAndUploadSnapshot() async {
    if (_cameraController == null || !_isCameraInitialized || _paperId == null) return;
    final api = Provider.of<ApiService>(context, listen: false);

    try {
      final XFile file = await _cameraController!.takePicture();
      final bytes = await file.readAsBytes();
      final String base64Image = base64Encode(bytes);
      final String dataUrl = 'data:image/jpeg;base64,$base64Image';

      // Delete the temporary file
      try {
        await File(file.path).delete();
      } catch (_) {}

      final bool faceDetected = _noFaceFrameCount < 3;
      final bool multipleFaces = _multiFaceFrameCount >= 2;

      // Local warning on screen (visual border and SnackBar warning)
      if (!faceDetected || multipleFaces) {
        final String msg = !faceDetected
            ? "No face detected! Please look at the camera."
            : "Multiple faces detected! Please ensure you are alone.";
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('Proctoring Warning: $msg'),
              backgroundColor: Colors.red,
              behavior: SnackBarBehavior.floating,
              duration: const Duration(seconds: 3),
            ),
          );
        }
      }

      final response = await api.post('/paper/$_paperId/snapshot', {
        'imageUrl': dataUrl,
        'faceDetected': faceDetected,
        'multipleFaces': multipleFaces,
      });

      if (mounted) {
        setState(() {
          _violations = response['totalViolations'] ?? _violations;
          _trustScore = response['trustScore'] ?? _trustScore;
        });

        final maxViolations = _exam?['proctoring']?['maxViolations'] ?? 5;
        if (_violations >= maxViolations) {
          _autoSubmit('Maximum violations exceeded');
        }
      }
    } catch (e) {
      debugPrint('Error capturing/uploading snapshot: $e');
    }
  }

  Future<void> _recordViolation(String type, String details) async {
    _cameraRedBorderTimer?.cancel();
    setState(() {
      _violations++;
      _trustScore = (_trustScore - 10).clamp(0, 100);
      _isCameraFrameRed = true;
    });

    _cameraRedBorderTimer = Timer(const Duration(seconds: 3), () {
      if (mounted) {
        setState(() {
          _isCameraFrameRed = false;
        });
      }
    });

    final maxViolations = _exam?['proctoring']?['maxViolations'] ?? 5;
    if (_violations >= maxViolations) {
      _autoSubmit('Maximum violations exceeded');
      return;
    }

    if (_paperId != null) {
      try {
        final api = Provider.of<ApiService>(context, listen: false);
        await api.post('/paper/$_paperId/violation', {'type': type, 'details': details});
      } catch (e) {
        // Silent fail
      }
    }

    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Proctoring Warning: $details'),
          backgroundColor: Colors.red,
          behavior: SnackBarBehavior.floating,
          duration: const Duration(seconds: 3),
        ),
      );
    }
  }

  Future<void> _autoSubmit(String reason) async {
    _timer?.cancel();
    _cameraController?.dispose();
    _cameraController = null;
    _faceDetector?.close();
    _faceDetector = null;
    SystemChrome.setPreferredOrientations(DeviceOrientation.values);
    SystemChrome.setEnabledSystemUIMode(SystemUiMode.edgeToEdge);

    final answers = _selectedAnswers.entries.map((e) => {
      'question_id': e.key,
      'selectedOption': e.value is List ? e.value : [e.value],
    }).toList();

    try {
      final api = Provider.of<ApiService>(context, listen: false);
      if (_paperId != null) {
        await api.post('/paper/$_paperId/auto-submit', {
          'reason': reason,
          'answers': answers,
          'proctoring': {
            'totalViolations': _violations,
            'trustScore': _trustScore,
          }
        });
      }
    } catch (e) {
      // Silent
    }

    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Exam auto-submitted: $reason'),
          backgroundColor: Colors.orange,
          behavior: SnackBarBehavior.floating,
        ),
      );
      Navigator.pop(context);
    }
  }

  Future<void> _submitExam() async {
    _timer?.cancel();
    _cameraController?.dispose();
    _cameraController = null;
    _faceDetector?.close();
    _faceDetector = null;
    SystemChrome.setPreferredOrientations(DeviceOrientation.values);
    SystemChrome.setEnabledSystemUIMode(SystemUiMode.edgeToEdge);

    final answers = _selectedAnswers.entries.map((e) => {
      'question_id': e.key,
      'selectedOption': e.value is List ? e.value : [e.value],
    }).toList();

    try {
      final api = Provider.of<ApiService>(context, listen: false);
      await api.post('/paper/${widget.examId}', {
        'answers': answers,
        'proctoring': {
          'totalViolations': _violations,
          'trustScore': _trustScore,
        }
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Exam submitted successfully!'),
            backgroundColor: Colors.green,
            behavior: SnackBarBehavior.floating,
          ),
        );
        Navigator.pop(context);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(e.toString().replaceAll('Exception: ', '')),
            backgroundColor: Colors.red,
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
    }
  }

  String _formatTime(int seconds) {
    final m = (seconds ~/ 60).toString().padLeft(2, '0');
    final s = (seconds % 60).toString().padLeft(2, '0');
    return '$m:$s';
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) return const Scaffold(body: Center(child: CircularProgressIndicator(color: Color(0xFF2563EB))));
    if (_exam == null) return const Scaffold(body: Center(child: Text('Exam not found', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold))));

    if (!_examStarted) {
      final isTabLock = _exam!['proctoring']?['tabLockEnabled'] == true;
      final isCamera = _exam!['proctoring']?['cameraEnabled'] == true;

      return Scaffold(
        backgroundColor: const Color(0xFFF8FAFC), // Slate 50
        body: SafeArea(
          child: Column(
            children: [
              // 1. Header Gradient Banner
              Container(
                width: double.infinity,
                decoration: const BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topCenter,
                    end: Alignment.bottomCenter,
                    colors: [Color(0xFF1E3A8A), Color(0xFF0F172A)],
                  ),
                ),
                padding: const EdgeInsets.fromLTRB(24, 32, 24, 36),
                child: Column(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: Colors.white.withValues(alpha: 0.1),
                        shape: BoxShape.circle,
                        border: Border.all(color: Colors.white.withValues(alpha: 0.2), width: 1.5),
                      ),
                      child: const Icon(
                        Icons.security_outlined,
                        size: 48,
                        color: Color(0xFF60A5FA), // Light Blue
                      ),
                    ),
                    const SizedBox(height: 20),
                    Text(
                      _exam!['title'] ?? 'Placement Examination',
                      textAlign: TextAlign.center,
                      style: const TextStyle(
                        fontSize: 22,
                        fontWeight: FontWeight.bold,
                        color: Colors.white,
                        letterSpacing: -0.5,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'AI-Proctored Test Session',
                      style: TextStyle(
                        fontSize: 14,
                        color: Colors.white.withValues(alpha: 0.6),
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ],
                ),
              ),

              // 2. Metrics and Proctoring Settings Card
              Expanded(
                child: SingleChildScrollView(
                  physics: const BouncingScrollPhysics(),
                  padding: const EdgeInsets.all(20),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Overview Grid Card
                      Card(
                        elevation: 0,
                        color: Colors.white,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(20),
                          side: const BorderSide(color: Color(0xFFE2E8F0)),
                        ),
                        child: Padding(
                          padding: const EdgeInsets.all(20),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text(
                                'Exam Parameters',
                                style: TextStyle(
                                  fontSize: 16,
                                  fontWeight: FontWeight.bold,
                                  color: Color(0xFF0F172A),
                                ),
                              ),
                              const SizedBox(height: 16),
                              GridView.count(
                                crossAxisCount: 2,
                                shrinkWrap: true,
                                physics: const NeverScrollableScrollPhysics(),
                                crossAxisSpacing: 16,
                                mainAxisSpacing: 16,
                                childAspectRatio: 2.3,
                                children: [
                                  _buildExamGridItem(
                                    icon: Icons.timer_outlined,
                                    label: 'DURATION',
                                    value: '${_exam!['timeLimit']} min',
                                    color: const Color(0xFF3B82F6),
                                  ),
                                  _buildExamGridItem(
                                    icon: Icons.quiz_outlined,
                                    label: 'QUESTIONS',
                                    value: '${_exam!['noOfQuestion']}',
                                    color: const Color(0xFF7C3AED),
                                  ),
                                  _buildExamGridItem(
                                    icon: Icons.tab_unselected_outlined,
                                    label: 'TAB LOCK',
                                    value: isTabLock ? 'Enabled' : 'Disabled',
                                    color: isTabLock ? const Color(0xFF10B981) : const Color(0xFF64748B),
                                  ),
                                  _buildExamGridItem(
                                    icon: Icons.videocam_outlined,
                                    label: 'PROCTORING',
                                    value: isCamera ? 'Camera ON' : 'Off',
                                    color: isCamera ? const Color(0xFF10B981) : const Color(0xFF64748B),
                                  ),
                                ],
                              ),
                            ],
                          ),
                        ),
                      ),
                      const SizedBox(height: 24),

                      // Instructions / Security Warnings
                      const Text(
                        'Rules & Guidelines',
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                          color: Color(0xFF0F172A),
                        ),
                      ),
                      const SizedBox(height: 12),
                      _buildRuleItem(
                        icon: Icons.fullscreen_exit_outlined,
                        title: 'Do Not Leave the Screen',
                        desc: 'Switching apps, taking screenshots, or responding to notifications will trigger a proctoring violation.',
                        isWarning: true,
                      ),
                      const SizedBox(height: 12),
                      if (isCamera) ...[
                        _buildRuleItem(
                          icon: Icons.face_retouching_natural_outlined,
                          title: 'Face Monitoring Active',
                          desc: 'Ensure you are in a well-lit room. Your camera must remain active and focused on your face at all times.',
                          isWarning: false,
                        ),
                        const SizedBox(height: 12),
                      ],
                      _buildRuleItem(
                        icon: Icons.lock_outline,
                        title: 'Auto-Submit Safeguard',
                        desc: 'Reaching the maximum violation count or closing the app entirely will automatically submit your exam session.',
                        isWarning: false,
                      ),
                      const SizedBox(height: 30),
                    ],
                  ),
                ),
              ),

              // 3. Bottom Action Bar
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
                decoration: BoxDecoration(
                  color: Colors.white,
                  border: Border(top: BorderSide(color: Colors.grey.shade100)),
                ),
                child: SafeArea(
                  top: false,
                  child: Container(
                    height: 52,
                    width: double.infinity,
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(26),
                      gradient: const LinearGradient(
                        colors: [Color(0xFF2563EB), Color(0xFF1D4ED8)],
                      ),
                      boxShadow: const [
                        BoxShadow(
                          color: Color(0x4D2563EB),
                          blurRadius: 12,
                          offset: Offset(0, 6),
                        ),
                      ],
                    ),
                    child: ElevatedButton.icon(
                      icon: const Icon(Icons.play_arrow_outlined, color: Colors.white),
                      label: const Text(
                        'Start Proctored Exam',
                        style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, letterSpacing: 0.5),
                      ),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.transparent,
                        foregroundColor: Colors.white,
                        shadowColor: Colors.transparent,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(26),
                        ),
                      ),
                      onPressed: _startExam,
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      );
    }

    final questions = _exam!['questions'] as List<dynamic>? ?? [];
    if (questions.isEmpty) return const Scaffold(body: Center(child: Text('No questions available')));
    final q = questions[_currentIndex];
    final options = (q['options'] as List?) ?? [];

    return PopScope(
      canPop: false,
      onPopInvokedWithResult: (didPop, result) {
        if (didPop) return;
        _recordViolation('browser_resize', 'Back button pressed during exam');
      },
      child: Scaffold(
        backgroundColor: const Color(0xFFF8FAFC), // Slate 50
        appBar: AppBar(
          backgroundColor: Colors.white,
          elevation: 0,
          scrolledUnderElevation: 0,
          automaticallyImplyLeading: false,
          title: Text(
            'Question ${_currentIndex + 1} of ${questions.length}',
            style: const TextStyle(color: Color(0xFF0F172A), fontWeight: FontWeight.bold, fontSize: 16),
          ),
          actions: [
            // Timer Badge
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
              margin: const EdgeInsets.symmetric(vertical: 10),
              decoration: BoxDecoration(
                color: _timeLeft < 60 ? const Color(0xFFFEE2E2) : const Color(0xFFEFF6FF),
                borderRadius: BorderRadius.circular(20),
              ),
              child: Row(
                children: [
                  Icon(
                    Icons.timer_outlined,
                    size: 16,
                    color: _timeLeft < 60 ? const Color(0xFFEF4444) : const Color(0xFF2563EB),
                  ),
                  const SizedBox(width: 6),
                  Text(
                    _formatTime(_timeLeft),
                    style: TextStyle(
                      fontWeight: FontWeight.bold,
                      fontSize: 13,
                      color: _timeLeft < 60 ? const Color(0xFFEF4444) : const Color(0xFF2563EB),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(width: 8),

            // Violations Badge
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
              margin: const EdgeInsets.symmetric(vertical: 10),
              decoration: BoxDecoration(
                color: _violations > 0 ? const Color(0xFFFEE2E2) : const Color(0xFFF1F5F9),
                borderRadius: BorderRadius.circular(20),
                border: Border.all(
                  color: _violations > 0 ? const Color(0xFFFCA5A5) : const Color(0xFFE2E8F0),
                  width: 1,
                ),
              ),
              child: Row(
                children: [
                  Icon(
                    Icons.warning_amber_rounded,
                    size: 14,
                    color: _violations > 0 ? const Color(0xFFEF4444) : const Color(0xFF64748B),
                  ),
                  const SizedBox(width: 4),
                  Text(
                    'Violations: $_violations/${_exam?['proctoring']?['maxViolations'] ?? 5}',
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.bold,
                      color: _violations > 0 ? const Color(0xFFEF4444) : const Color(0xFF64748B),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(width: 8),

            // Trust Score Badge
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
              margin: const EdgeInsets.only(right: 16, top: 10, bottom: 10),
              decoration: BoxDecoration(
                color: _trustScore >= 70 ? const Color(0xFFD1FAE5) : const Color(0xFFFEE2E2),
                borderRadius: BorderRadius.circular(20),
              ),
              child: Row(
                children: [
                  Icon(
                    Icons.shield_outlined,
                    size: 14,
                    color: _trustScore >= 70 ? const Color(0xFF059669) : const Color(0xFFDC2626),
                  ),
                  const SizedBox(width: 4),
                  Text(
                    '$_trustScore%',
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.bold,
                      color: _trustScore >= 70 ? const Color(0xFF059669) : const Color(0xFFDC2626),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
        body: Stack(
          children: [
            Column(
              children: [
                // Linear Progress Indicator
                LinearProgressIndicator(
                  value: (_currentIndex + 1) / questions.length,
                  backgroundColor: const Color(0xFFE2E8F0),
                  color: const Color(0xFF2563EB),
                  minHeight: 5,
                ),
            
            Expanded(
              child: SingleChildScrollView(
                physics: const BouncingScrollPhysics(),
                padding: const EdgeInsets.all(20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Question box
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(20),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: const Color(0xFFE2E8F0)),
                      ),
                      child: Text(
                        q['questionText'] ?? '',
                        style: const TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                          color: Color(0xFF0F172A),
                          height: 1.5,
                        ),
                      ),
                    ),
                    const SizedBox(height: 24),
                    
                    // Options Label
                    const Text(
                      'Choose correct option:',
                      style: TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.bold,
                        color: Color(0xFF475569),
                      ),
                    ),
                    const SizedBox(height: 12),

                    // Options List
                    ...List.generate(options.length, (optIdx) {
                      final opt = options[optIdx];
                      final isSelected = _selectedAnswers[q['_id']] == opt['_id'];
                      final optionLetter = String.fromCharCode(65 + optIdx); // A, B, C, D...

                      return GestureDetector(
                        onTap: () => setState(() => _selectedAnswers[q['_id']] = opt['_id']),
                        child: Container(
                          margin: const EdgeInsets.only(bottom: 12),
                          padding: const EdgeInsets.all(16),
                          decoration: BoxDecoration(
                            border: Border.all(
                              color: isSelected ? const Color(0xFF2563EB) : const Color(0xFFE2E8F0),
                              width: isSelected ? 2 : 1,
                            ),
                            borderRadius: BorderRadius.circular(12),
                            color: isSelected ? const Color(0xFFEFF6FF) : Colors.white,
                          ),
                          child: Row(
                            children: [
                              // Letter Avatar Badge
                              Container(
                                width: 28,
                                height: 28,
                                decoration: BoxDecoration(
                                  shape: BoxShape.circle,
                                  color: isSelected ? const Color(0xFF2563EB) : const Color(0xFFF1F5F9),
                                ),
                                child: Center(
                                  child: Text(
                                    optionLetter,
                                    style: TextStyle(
                                      color: isSelected ? Colors.white : const Color(0xFF475569),
                                      fontWeight: FontWeight.bold,
                                      fontSize: 13,
                                    ),
                                  ),
                                ),
                              ),
                              const SizedBox(width: 14),
                              
                              // Option Text
                              Expanded(
                                child: Text(
                                  opt['optionText'] ?? '',
                                  style: TextStyle(
                                    fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
                                    color: isSelected ? const Color(0xFF1E3A8A) : const Color(0xFF334155),
                                    fontSize: 14,
                                  ),
                                ),
                              ),
                              const SizedBox(width: 8),

                              // Selection circle indicator
                              Container(
                                width: 22,
                                height: 22,
                                decoration: BoxDecoration(
                                  shape: BoxShape.circle,
                                  border: Border.all(
                                    color: isSelected ? const Color(0xFF2563EB) : const Color(0xFFCBD5E1),
                                    width: 2,
                                  ),
                                  color: isSelected ? const Color(0xFF2563EB) : Colors.transparent,
                                ),
                                child: isSelected
                                    ? const Icon(Icons.check, size: 14, color: Colors.white)
                                    : null,
                              ),
                            ],
                          ),
                        ),
                      );
                    }),
                  ],
                ),
              ),
            ),
            
            // Bottom Action Controls
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
              decoration: BoxDecoration(
                color: Colors.white,
                border: Border(top: BorderSide(color: Colors.grey.shade100)),
              ),
              child: Row(
                children: [
                  // Back button
                  if (_currentIndex > 0) ...[
                    Expanded(
                      child: SizedBox(
                        height: 48,
                        child: OutlinedButton.icon(
                          icon: const Icon(Icons.arrow_back_outlined, size: 18),
                          label: const Text(
                            'Previous',
                            style: TextStyle(fontWeight: FontWeight.bold),
                          ),
                          style: OutlinedButton.styleFrom(
                            foregroundColor: const Color(0xFF475569),
                            side: const BorderSide(color: Color(0xFFCBD5E1)),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(24),
                            ),
                          ),
                          onPressed: () => setState(() => _currentIndex--),
                        ),
                      ),
                    ),
                    const SizedBox(width: 12),
                  ],

                  // Next / Submit button
                  Expanded(
                    child: SizedBox(
                      height: 48,
                      child: _currentIndex == questions.length - 1
                          ? Container(
                              decoration: BoxDecoration(
                                borderRadius: BorderRadius.circular(24),
                                gradient: const LinearGradient(
                                  colors: [Color(0xFF10B981), Color(0xFF059669)],
                                ),
                              ),
                              child: ElevatedButton.icon(
                                icon: const Icon(Icons.send_outlined, color: Colors.white, size: 18),
                                label: const Text(
                                  'Submit Exam',
                                  style: TextStyle(fontWeight: FontWeight.bold, color: Colors.white),
                                ),
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: Colors.transparent,
                                  shadowColor: Colors.transparent,
                                  shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(24),
                                  ),
                                ),
                                onPressed: () {
                                  showDialog(
                                    context: context,
                                    builder: (ctx) => AlertDialog(
                                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                                      title: const Text('Submit Examination?', style: TextStyle(fontWeight: FontWeight.bold)),
                                      content: Text('You have answered ${_selectedAnswers.length} out of ${questions.length} questions. Do you want to submit?'),
                                      actions: [
                                        TextButton(
                                          onPressed: () => Navigator.pop(ctx),
                                          child: const Text('Cancel', style: TextStyle(color: Color(0xFF475569), fontWeight: FontWeight.bold)),
                                        ),
                                        ElevatedButton(
                                          style: ElevatedButton.styleFrom(
                                            backgroundColor: const Color(0xFF10B981),
                                            foregroundColor: Colors.white,
                                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                                          ),
                                          onPressed: () {
                                            Navigator.pop(ctx);
                                            _submitExam();
                                          },
                                          child: const Text('Submit', style: TextStyle(fontWeight: FontWeight.bold)),
                                        ),
                                      ],
                                    ),
                                  );
                                },
                              ),
                            )
                          : Container(
                              decoration: BoxDecoration(
                                borderRadius: BorderRadius.circular(24),
                                gradient: const LinearGradient(
                                  colors: [Color(0xFF2563EB), Color(0xFF1D4ED8)],
                                ),
                              ),
                              child: ElevatedButton.icon(
                                icon: const Icon(Icons.arrow_forward_outlined, color: Colors.white, size: 18),
                                label: const Text(
                                  'Next',
                                  style: TextStyle(fontWeight: FontWeight.bold, color: Colors.white),
                                ),
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: Colors.transparent,
                                  shadowColor: Colors.transparent,
                                  shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(24),
                                  ),
                                ),
                                onPressed: () => setState(() => _currentIndex++),
                              ),
                            ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
        if (_isCameraInitialized && _cameraController != null)
          Positioned(
            top: 16,
            right: 16,
            child: _showCameraPreview
                ? _buildCameraPreviewOverlay()
                : _buildMinimizedCameraOverlay(),
          ),
      ],
    ),
  ),
);
  }

  Widget _buildExamGridItem({
    required IconData icon,
    required String label,
    required String value,
    required Color color,
  }) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: const Color(0xFFF8FAFC),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(6),
            decoration: BoxDecoration(
              color: color.withOpacity(0.12),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Icon(icon, color: color, size: 18),
          ),
          const SizedBox(width: 8),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text(
                  label,
                  style: const TextStyle(
                    color: Color(0xFF64748B),
                    fontSize: 8,
                    fontWeight: FontWeight.bold,
                    letterSpacing: 0.5,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  value,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    color: Color(0xFF0F172A),
                    fontSize: 12,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildRuleItem({
    required IconData icon,
    required String title,
    required String desc,
    required bool isWarning,
  }) {
    final themeColor = isWarning ? const Color(0xFFEF4444) : const Color(0xFF2563EB);

    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: themeColor.withOpacity(0.12),
              shape: BoxShape.circle,
            ),
            child: Icon(icon, color: themeColor, size: 20),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: const TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.bold,
                    color: Color(0xFF0F172A),
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  desc,
                  style: const TextStyle(
                    fontSize: 12,
                    color: Color(0xFF475569),
                    height: 1.4,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _CameraLiveDot extends StatefulWidget {
  const _CameraLiveDot();

  @override
  State<_CameraLiveDot> createState() => _CameraLiveDotState();
}

class _CameraLiveDotState extends State<_CameraLiveDot> with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _animation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1000),
    )..repeat(reverse: true);
    _animation = Tween<double>(begin: 0.2, end: 1.0).animate(_controller);
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return FadeTransition(
      opacity: _animation,
      child: Container(
        width: 6,
        height: 6,
        decoration: const BoxDecoration(
          color: Colors.white,
          shape: BoxShape.circle,
        ),
      ),
    );
  }
}
