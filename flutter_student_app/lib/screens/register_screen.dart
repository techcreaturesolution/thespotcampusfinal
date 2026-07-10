import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../services/auth_service.dart';
import '../services/api_service.dart';
import '../utils/constants.dart';
import '../widgets/glass_container.dart';

class RegisterScreen extends StatefulWidget {
  const RegisterScreen({super.key});

  @override
  State<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends State<RegisterScreen> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _contactController = TextEditingController();
  final _enrollmentController = TextEditingController();
  final _semesterController = TextEditingController();
  final _skillsController = TextEditingController();

  final _nameFocusNode = FocusNode();
  final _emailFocusNode = FocusNode();
  final _passwordFocusNode = FocusNode();
  final _contactFocusNode = FocusNode();
  final _enrollmentFocusNode = FocusNode();
  final _universityFocusNode = FocusNode();
  final _collegeFocusNode = FocusNode();
  final _degreeFocusNode = FocusNode();
  final _branchFocusNode = FocusNode();
  final _semesterFocusNode = FocusNode();

  List<dynamic> _universities = [];
  List<dynamic> _colleges = [];
  List<dynamic> _degrees = [];
  List<dynamic> _branches = [];

  String? _selectedUniversityId;
  String? _selectedCollegeId;
  String? _selectedDegreeId;
  String? _selectedBranchId;
  bool _loadingDropdowns = false;
  bool _obscurePassword = true;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _loadUniversities();
    });
  }

  Future<void> _loadUniversities() async {
    setState(() => _loadingDropdowns = true);
    try {
      final api = Provider.of<ApiService>(context, listen: false);
      final res = await api.get('/dropdown/universities');
      setState(() {
        _universities = res['universities'] ?? [];
      });
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to load universities: $e'), backgroundColor: Colors.red),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _loadingDropdowns = false);
      }
    }
  }

  Future<void> _loadColleges(String universityId) async {
    setState(() => _loadingDropdowns = true);
    try {
      final api = Provider.of<ApiService>(context, listen: false);
      final res = await api.get('/dropdown/colleges?university_id=$universityId');
      setState(() {
        _colleges = res['colleges'] ?? [];
      });
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to load colleges: $e'), backgroundColor: Colors.red),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _loadingDropdowns = false);
      }
    }
  }

  Future<void> _loadDegrees(String collegeId) async {
    setState(() => _loadingDropdowns = true);
    try {
      final api = Provider.of<ApiService>(context, listen: false);
      final res = await api.get('/dropdown/degrees?college_id=$collegeId');
      setState(() {
        _degrees = res['degrees'] ?? [];
      });
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to load degrees: $e'), backgroundColor: Colors.red),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _loadingDropdowns = false);
      }
    }
  }

  Future<void> _loadBranches(String degreeId) async {
    setState(() => _loadingDropdowns = true);
    try {
      final api = Provider.of<ApiService>(context, listen: false);
      final res = await api.get('/dropdown/branches?degree_id=$degreeId&college_id=$_selectedCollegeId');
      setState(() {
        _branches = res['branches'] ?? [];
      });
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to load branches: $e'), backgroundColor: Colors.red),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _loadingDropdowns = false);
      }
    }
  }

  Future<void> _handleRegister() async {
    if (_nameController.text.trim().isEmpty) {
      _nameFocusNode.requestFocus();
      _formKey.currentState!.validate();
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter your Full Name'), backgroundColor: Colors.red),
      );
      return;
    }
    final email = _emailController.text.trim();
    if (email.isEmpty || !email.contains('@')) {
      _emailFocusNode.requestFocus();
      _formKey.currentState!.validate();
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter a valid Email Address'), backgroundColor: Colors.red),
      );
      return;
    }
    if (_passwordController.text.length < 6) {
      _passwordFocusNode.requestFocus();
      _formKey.currentState!.validate();
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Password must be at least 6 characters'), backgroundColor: Colors.red),
      );
      return;
    }
    if (_contactController.text.trim().isEmpty) {
      _contactFocusNode.requestFocus();
      _formKey.currentState!.validate();
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter your Contact Number'), backgroundColor: Colors.red),
      );
      return;
    }
    if (_enrollmentController.text.trim().isEmpty) {
      _enrollmentFocusNode.requestFocus();
      _formKey.currentState!.validate();
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter your Enrollment Number'), backgroundColor: Colors.red),
      );
      return;
    }
    if (_selectedUniversityId == null) {
      _universityFocusNode.requestFocus();
      _formKey.currentState!.validate();
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please select your University'), backgroundColor: Colors.red),
      );
      return;
    }
    if (_selectedCollegeId == null) {
      _collegeFocusNode.requestFocus();
      _formKey.currentState!.validate();
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please select your College'), backgroundColor: Colors.red),
      );
      return;
    }
    if (_selectedDegreeId == null) {
      _degreeFocusNode.requestFocus();
      _formKey.currentState!.validate();
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please select your Degree'), backgroundColor: Colors.red),
      );
      return;
    }
    if (_selectedBranchId == null) {
      _branchFocusNode.requestFocus();
      _formKey.currentState!.validate();
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please select your Branch'), backgroundColor: Colors.red),
      );
      return;
    }
    if (_semesterController.text.trim().isEmpty) {
      _semesterFocusNode.requestFocus();
      _formKey.currentState!.validate();
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter your Current Semester'), backgroundColor: Colors.red),
      );
      return;
    }

    if (!_formKey.currentState!.validate()) return;

    final auth = Provider.of<AuthService>(context, listen: false);
    try {
      final success = await auth.register({
        'student_name': _nameController.text.trim(),
        'student_email': _emailController.text.trim(),
        'student_password': _passwordController.text,
        'student_contact': _contactController.text.trim(),
        'student_enrollment': _enrollmentController.text.trim(),
        'university_id': _selectedUniversityId,
        'college_id': _selectedCollegeId,
        'degree_id': _selectedDegreeId,
        'branch_id': _selectedBranchId,
        'student_current_sem': _semesterController.text.trim(),
        'student_skills': _skillsController.text.trim(),
        'student_total_backlog': '0',
      });

      if (!mounted) return;
      if (success) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Registration successful! Please login.'), backgroundColor: Colors.green),
        );
        Navigator.pop(context);
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Registration failed. Please try again.'), backgroundColor: Colors.red),
        );
      }
    } on ApiException catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(e.message), backgroundColor: Colors.red),
      );
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('An unexpected error occurred during registration'), backgroundColor: Colors.red),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = Provider.of<AuthService>(context);
    final screenSize = MediaQuery.of(context).size;

    return Scaffold(
      body: Stack(
        children: [
          // 1. Layered Background Gradient
          Container(
            width: double.infinity,
            height: double.infinity,
            decoration: AppStyles.glassmorphismBackground,
          ),

          // 2. Floating Background Orbs
          _buildBackgroundOrb(
            top: -60,
            right: -60,
            size: 260,
            colors: const [
              Color(0x3F06B6D4), // Teal fading
              Color(0x0006B6D4),
            ],
          ),
          _buildBackgroundOrb(
            top: screenSize.height * 0.5,
            left: -100,
            size: 300,
            colors: const [
              Color(0x284F46E5), // Indigo fading
              Color(0x004F46E5),
            ],
          ),
          _buildBackgroundOrb(
            bottom: -40,
            right: -40,
            size: 200,
            colors: const [
              Color(0x283B82F6), // Blue fading
              Color(0x003B82F6),
            ],
          ),

          // 3. Scrollable Content Layer
          SafeArea(
            child: SingleChildScrollView(
              physics: const BouncingScrollPhysics(),
              child: Container(
                width: double.infinity,
                padding: const EdgeInsets.symmetric(horizontal: 20),
                child: Column(
                  children: [
                    const SizedBox(height: 36),

                    // Logo in a premium glassmorphic badge container
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 28, vertical: 14),
                      decoration: BoxDecoration(
                        color: const Color(0xE6FFFFFF), // Semi-transparent white
                        borderRadius: BorderRadius.circular(24),
                        border: Border.all(color: const Color(0x4DFFFFFF), width: 1.5),
                        boxShadow: const [
                          BoxShadow(
                            color: Color(0x1A000000),
                            blurRadius: 16,
                            offset: Offset(0, 8),
                          ),
                        ],
                      ),
                      child: Image.asset(
                        'assets/images/logo_TSC.png',
                        height: 38,
                        fit: BoxFit.contain,
                      ),
                    ),

                    const SizedBox(height: 36),

                    // Main Heading
                    const Align(
                      alignment: Alignment.centerLeft,
                      child: Padding(
                        padding: EdgeInsets.symmetric(horizontal: 8),
                        child: Text(
                          'Create Account',
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 34,
                            fontWeight: FontWeight.w900,
                            letterSpacing: -0.5,
                          ),
                        ),
                      ),
                    ),
                    const Align(
                      alignment: Alignment.centerLeft,
                      child: Padding(
                        padding: EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                        child: Text(
                          'Join our AI placement portal to secure your future',
                          style: TextStyle(
                            color: Color(0xFF94A3B8), // Slate 400
                            fontSize: 14,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ),
                    ),

                    const SizedBox(height: 24),

                    // 4. Scrollable Floating Form Card
                    GlassContainer(
                      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 32),
                      child: Form(
                        key: _formKey,
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            // SECTION 1: Personal Details
                            Row(
                              children: [
                                Icon(Icons.person, color: Colors.white, size: 20),
                                SizedBox(width: 8),
                                Text(
                                  'Personal Information',
                                  style: TextStyle(
                                    fontSize: 16,
                                    fontWeight: FontWeight.bold,
                                    color: Colors.white,
                                  ),
                                ),
                              ],
                            ),
                            Divider(height: 24, thickness: 1, color: Colors.white.withOpacity(0.2)),
                            const SizedBox(height: 12),

                            _buildTextField(
                              controller: _nameController,
                              focusNode: _nameFocusNode,
                              label: 'Full Name',
                              hint: 'Enter your full name',
                              icon: Icons.person_outline,
                              validator: (v) => v == null || v.isEmpty ? 'Name required' : null,
                            ),

                            _buildTextField(
                              controller: _emailController,
                              focusNode: _emailFocusNode,
                              label: 'Email Address',
                              hint: 'Enter email address',
                              icon: Icons.email_outlined,
                              keyboardType: TextInputType.emailAddress,
                              validator: (v) => v == null || !v.contains('@') ? 'Valid email required' : null,
                            ),

                            // Password Field with capsule layout & toggle
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Padding(
                                  padding: const EdgeInsets.symmetric(horizontal: 4),
                                  child: Text(
                                    'Password',
                                    style: TextStyle(
                                      fontSize: 14,
                                      fontWeight: FontWeight.bold,
                                      color: Colors.white.withOpacity(0.9),
                                    ),
                                  ),
                                ),
                                const SizedBox(height: 8),
                                TextFormField(
                                  controller: _passwordController,
                                  focusNode: _passwordFocusNode,
                                  obscureText: _obscurePassword,
                                  style: const TextStyle(color: Colors.white, fontSize: 15, fontWeight: FontWeight.w500),
                                  decoration: InputDecoration(
                                    hintText: 'Choose a strong password',
                                    hintStyle: TextStyle(color: Colors.white.withOpacity(0.5), fontSize: 14),
                                    prefixIcon: Icon(Icons.lock_outlined, color: Colors.white.withOpacity(0.8), size: 20),
                                    suffixIcon: Padding(
                                      padding: const EdgeInsets.only(right: 8),
                                      child: IconButton(
                                        icon: Icon(
                                          _obscurePassword ? Icons.visibility_off_outlined : Icons.visibility_outlined,
                                          color: Colors.white.withOpacity(0.7),
                                          size: 20,
                                        ),
                                        onPressed: () => setState(() => _obscurePassword = !_obscurePassword),
                                      ),
                                    ),
                                    filled: true,
                                    fillColor: Colors.white.withOpacity(0.1),
                                    contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
                                    border: OutlineInputBorder(
                                      borderRadius: BorderRadius.circular(30),
                                      borderSide: BorderSide.none,
                                    ),
                                    enabledBorder: OutlineInputBorder(
                                      borderRadius: BorderRadius.circular(30),
                                      borderSide: BorderSide(color: Colors.white.withOpacity(0.2)),
                                    ),
                                    focusedBorder: OutlineInputBorder(
                                      borderRadius: BorderRadius.circular(30),
                                      borderSide: const BorderSide(color: Colors.white, width: 1.5),
                                    ),
                                    errorBorder: OutlineInputBorder(
                                      borderRadius: BorderRadius.circular(30),
                                      borderSide: const BorderSide(color: Colors.redAccent, width: 1),
                                    ),
                                    focusedErrorBorder: OutlineInputBorder(
                                      borderRadius: BorderRadius.circular(30),
                                      borderSide: const BorderSide(color: Colors.redAccent, width: 1.5),
                                    ),
                                  ),
                                  validator: (v) => v == null || v.length < 6 ? 'Min 6 characters' : null,
                                ),
                                const SizedBox(height: 20),
                              ],
                            ),

                            _buildTextField(
                              controller: _contactController,
                              focusNode: _contactFocusNode,
                              label: 'Contact Number',
                              hint: 'Enter mobile number',
                              icon: Icons.phone_outlined,
                              keyboardType: TextInputType.phone,
                              validator: (v) => v == null || v.isEmpty ? 'Contact required' : null,
                            ),

                             _buildTextField(
                               controller: _enrollmentController,
                               focusNode: _enrollmentFocusNode,
                               label: 'Enrollment Number',
                               hint: 'Enter enrollment number',
                               icon: Icons.badge_outlined,
                               validator: (v) => v == null || v.isEmpty ? 'Enrollment required' : null,
                             ),

                            const SizedBox(height: 20),
                            
                            // SECTION 2: Academic Details
                            Row(
                              children: [
                                Icon(Icons.school, color: Colors.white, size: 20),
                                SizedBox(width: 8),
                                Text(
                                  'Academic Information',
                                  style: TextStyle(
                                    fontSize: 16,
                                    fontWeight: FontWeight.bold,
                                    color: Colors.white,
                                  ),
                                ),
                              ],
                            ),
                            Divider(height: 24, thickness: 1, color: Colors.white.withOpacity(0.2)),
                            const SizedBox(height: 12),

                            // University Dropdown
                             _buildDropdownField<String>(
                               label: 'University',
                               value: _selectedUniversityId,
                               focusNode: _universityFocusNode,
                               icon: Icons.school_outlined,
                              hint: _loadingDropdowns && _universities.isEmpty ? 'Loading...' : 'Select University',
                              items: _universities.map<DropdownMenuItem<String>>((u) {
                                return DropdownMenuItem<String>(
                                  value: u['_id'] as String,
                                  child: Text(u['university_name'] as String, overflow: TextOverflow.ellipsis),
                                );
                              }).toList(),
                              onChanged: _loadingDropdowns
                                  ? null
                                  : (val) {
                                      setState(() {
                                        _selectedUniversityId = val;
                                        _selectedCollegeId = null;
                                        _selectedDegreeId = null;
                                        _selectedBranchId = null;
                                        _colleges = [];
                                        _degrees = [];
                                        _branches = [];
                                      });
                                      if (val != null) _loadColleges(val);
                                    },
                              validator: (v) => v == null ? 'University required' : null,
                            ),

                            // College Dropdown
                             _buildDropdownField<String>(
                               label: 'College',
                               value: _selectedCollegeId,
                               focusNode: _collegeFocusNode,
                               icon: Icons.location_city_outlined,
                              hint: _selectedUniversityId == null 
                                  ? 'Select university first'
                                  : (_loadingDropdowns && _colleges.isEmpty ? 'Loading...' : 'Select College'),
                              items: _colleges.map<DropdownMenuItem<String>>((c) {
                                return DropdownMenuItem<String>(
                                  value: c['_id'] as String,
                                  child: Text(c['college_name'] as String, overflow: TextOverflow.ellipsis),
                                );
                              }).toList(),
                              onChanged: _loadingDropdowns || _selectedUniversityId == null
                                  ? null
                                  : (val) {
                                      setState(() {
                                        _selectedCollegeId = val;
                                        _selectedDegreeId = null;
                                        _selectedBranchId = null;
                                        _degrees = [];
                                        _branches = [];
                                      });
                                      if (val != null) _loadDegrees(val);
                                    },
                              validator: (v) => v == null ? 'College required' : null,
                            ),

                            // Degree Dropdown
                             _buildDropdownField<String>(
                               label: 'Degree',
                               value: _selectedDegreeId,
                               focusNode: _degreeFocusNode,
                               icon: Icons.class_outlined,
                              hint: _selectedCollegeId == null 
                                  ? 'Select college first'
                                  : (_loadingDropdowns && _degrees.isEmpty ? 'Loading...' : 'Select Degree'),
                              items: _degrees.map<DropdownMenuItem<String>>((d) {
                                return DropdownMenuItem<String>(
                                  value: d['_id'] as String,
                                  child: Text(d['degree_name'] as String, overflow: TextOverflow.ellipsis),
                                );
                              }).toList(),
                              onChanged: _loadingDropdowns || _selectedCollegeId == null
                                  ? null
                                  : (val) {
                                      setState(() {
                                        _selectedDegreeId = val;
                                        _selectedBranchId = null;
                                        _branches = [];
                                      });
                                      if (val != null) _loadBranches(val);
                                    },
                              validator: (v) => v == null ? 'Degree required' : null,
                            ),

                            // Branch Dropdown
                             _buildDropdownField<String>(
                               label: 'Branch',
                               value: _selectedBranchId,
                               focusNode: _branchFocusNode,
                               icon: Icons.account_tree_outlined,
                               hint: _selectedDegreeId == null 
                                   ? 'Select degree first'
                                   : (_loadingDropdowns && _branches.isEmpty ? 'Loading...' : 'Select Branch'),
                               items: _branches.map<DropdownMenuItem<String>>((b) {
                                 return DropdownMenuItem<String>(
                                   value: b['_id'] as String,
                                   child: Text(b['branch_name'] as String, overflow: TextOverflow.ellipsis),
                                 );
                               }).toList(),
                               onChanged: _loadingDropdowns || _selectedDegreeId == null
                                   ? null
                                   : (val) {
                                       setState(() {
                                         _selectedBranchId = val;
                                       });
                                     },
                               validator: (v) => v == null ? 'Branch required' : null,
                             ),

                             _buildTextField(
                               controller: _semesterController,
                               focusNode: _semesterFocusNode,
                               label: 'Current Semester',
                               hint: 'Enter semester number',
                               icon: Icons.calendar_today_outlined,
                               keyboardType: TextInputType.number,
                               validator: (v) => v == null || v.isEmpty ? 'Semester required' : null,
                             ),

                            _buildTextField(
                              controller: _skillsController,
                              label: 'Skills',
                              hint: 'e.g. React, Flutter, Python',
                              icon: Icons.star_outline,
                              validator: (v) => null,
                            ),

                            const SizedBox(height: 16),
                            
                            // Gradient Pill Register Button
                            Container(
                              width: double.infinity,
                              height: 52,
                              decoration: BoxDecoration(
                                borderRadius: BorderRadius.circular(26),
                                gradient: const LinearGradient(
                                  colors: [
                                    Color(0xFF2563EB), // Primary Blue
                                    Color(0xFF1D4ED8), // Darker Blue
                                  ],
                                ),
                                boxShadow: const [
                                  BoxShadow(
                                    color: Color(0x4D2563EB),
                                    blurRadius: 12,
                                    offset: Offset(0, 6),
                                  ),
                                ],
                              ),
                              child: ElevatedButton(
                                onPressed: auth.isLoading || _loadingDropdowns ? null : _handleRegister,
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: Colors.transparent,
                                  foregroundColor: Colors.white,
                                  shadowColor: Colors.transparent,
                                  elevation: 0,
                                  shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(26),
                                  ),
                                ),
                                child: auth.isLoading || _loadingDropdowns
                                    ? const SizedBox(
                                        height: 18,
                                        width: 18,
                                        child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                                      )
                                    : const Text(
                                        'Register',
                                        style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, letterSpacing: 0.5),
                                      ),
                              ),
                            ),
                            
                            const SizedBox(height: 32),
                            
                            // Navigate back to Login
                            Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                const Text(
                                  "Already have an account? ",
                                  style: TextStyle(
                                    color: Color(0xFF64748B),
                                    fontSize: 14,
                                    fontWeight: FontWeight.w500,
                                  ),
                                ),
                                InkWell(
                                  onTap: () => Navigator.pop(context),
                                  child: const Padding(
                                    padding: EdgeInsets.symmetric(vertical: 4, horizontal: 2),
                                    child: Text(
                                      'Sign In',
                                      style: TextStyle(
                                        color: Color(0xFF2563EB),
                                        fontWeight: FontWeight.w900,
                                        fontSize: 14,
                                        decoration: TextDecoration.underline,
                                      ),
                                    ),
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 16),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(height: 36),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildBackgroundOrb({
    double? top,
    double? bottom,
    double? left,
    double? right,
    required double size,
    required List<Color> colors,
  }) {
    return Positioned(
      top: top,
      bottom: bottom,
      left: left,
      right: right,
      child: Container(
        width: size,
        height: size,
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          gradient: RadialGradient(
            colors: colors,
          ),
        ),
      ),
    );
  }

  Widget _buildTextField({
    required TextEditingController controller,
    required String label,
    required String hint,
    required IconData icon,
    bool obscureText = false,
    TextInputType keyboardType = TextInputType.text,
    required String? Function(String?) validator,
    Widget? suffixIcon,
    FocusNode? focusNode,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 4),
          child: Text(
            label,
            style: TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.bold,
              color: Colors.white.withOpacity(0.9),
            ),
          ),
        ),
        const SizedBox(height: 8),
        TextFormField(
          controller: controller,
          focusNode: focusNode,
          obscureText: obscureText,
          keyboardType: keyboardType,
          style: const TextStyle(color: Colors.white, fontSize: 15, fontWeight: FontWeight.w500),
          decoration: InputDecoration(
            hintText: hint,
            hintStyle: TextStyle(color: Colors.white.withOpacity(0.5), fontSize: 14),
            prefixIcon: Icon(icon, color: Colors.white.withOpacity(0.8), size: 20),
            suffixIcon: suffixIcon,
            filled: true,
            fillColor: Colors.white.withOpacity(0.1),
            contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(30),
              borderSide: BorderSide.none,
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(30),
              borderSide: BorderSide(color: Colors.white.withOpacity(0.2)),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(30),
              borderSide: const BorderSide(color: Colors.white, width: 1.5),
            ),
            errorBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(30),
              borderSide: const BorderSide(color: Colors.redAccent, width: 1),
            ),
            focusedErrorBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(30),
              borderSide: const BorderSide(color: Colors.redAccent, width: 1.5),
            ),
          ),
          validator: validator,
        ),
        const SizedBox(height: 20),
      ],
    );
  }

  Widget _buildDropdownField<T>({
    required String label,
    required T? value,
    required IconData icon,
    required String hint,
    required List<DropdownMenuItem<T>> items,
    required ValueChanged<T?>? onChanged,
    required String? Function(T?) validator,
    FocusNode? focusNode,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 4),
          child: Text(
            label,
            style: TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.bold,
              color: Colors.white.withOpacity(0.9),
            ),
          ),
        ),
        const SizedBox(height: 8),
        DropdownButtonFormField<T>(
          value: value,
          focusNode: focusNode,
          isExpanded: true,
          icon: Icon(Icons.arrow_drop_down, color: Colors.white.withOpacity(0.8)),
          style: const TextStyle(color: Colors.white, fontSize: 15, fontWeight: FontWeight.w500),
          dropdownColor: const Color(0xFF1C2541), // Deep slate blue for dropdown menu
          decoration: InputDecoration(
            prefixIcon: Icon(icon, color: Colors.white.withOpacity(0.8), size: 20),
            filled: true,
            fillColor: Colors.white.withOpacity(0.1),
            contentPadding: const EdgeInsets.only(left: 8, right: 20, top: 12, bottom: 12),
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(30),
              borderSide: BorderSide.none,
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(30),
              borderSide: BorderSide(color: Colors.white.withOpacity(0.2)),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(30),
              borderSide: const BorderSide(color: Colors.white, width: 1.5),
            ),
            errorBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(30),
              borderSide: const BorderSide(color: Colors.redAccent, width: 1),
            ),
            focusedErrorBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(30),
              borderSide: const BorderSide(color: Colors.redAccent, width: 1.5),
            ),
          ),
          hint: Text(hint, style: TextStyle(color: Colors.white.withOpacity(0.5), fontSize: 14), overflow: TextOverflow.ellipsis),
          items: items,
          onChanged: onChanged,
          validator: validator,
        ),
        const SizedBox(height: 20),
      ],
    );
  }

  @override
  void dispose() {
    _nameController.dispose();
    _emailController.dispose();
    _passwordController.dispose();
    _contactController.dispose();
    _enrollmentController.dispose();
    _semesterController.dispose();
    _skillsController.dispose();

    _nameFocusNode.dispose();
    _emailFocusNode.dispose();
    _passwordFocusNode.dispose();
    _contactFocusNode.dispose();
    _enrollmentFocusNode.dispose();
    _universityFocusNode.dispose();
    _collegeFocusNode.dispose();
    _degreeFocusNode.dispose();
    _branchFocusNode.dispose();
    _semesterFocusNode.dispose();

    super.dispose();
  }
}
