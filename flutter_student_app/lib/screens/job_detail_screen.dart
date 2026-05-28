import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../services/api_service.dart';

class JobDetailScreen extends StatefulWidget {
  final String jobId;
  const JobDetailScreen({super.key, required this.jobId});

  @override
  State<JobDetailScreen> createState() => _JobDetailScreenState();
}

class _JobDetailScreenState extends State<JobDetailScreen> {
  Map<String, dynamic>? _job;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _fetchJob();
  }

  Future<void> _fetchJob() async {
    try {
      final api = Provider.of<ApiService>(context, listen: false);
      final data = await api.get('/jobs/${widget.jobId}');
      setState(() { _job = data['job']; _loading = false; });
    } catch (e) {
      setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Job Details')),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _job == null
              ? const Center(child: Text('Job not found'))
              : SingleChildScrollView(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(_job!['job_title'] ?? '', style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold)),
                      const SizedBox(height: 8),
                      Text(_job!['job_company_id']?['company_name'] ?? '', style: TextStyle(fontSize: 16, color: Colors.grey.shade600)),
                      const SizedBox(height: 16),
                      Wrap(
                        spacing: 8,
                        runSpacing: 8,
                        children: [
                          _Chip(label: _job!['job_type'] ?? '', color: const Color(0xFF2563EB)),
                          _Chip(label: _job!['job_work_mode'] ?? '', color: const Color(0xFF059669)),
                          if (_job!['job_exp'] != null) _Chip(label: _job!['job_exp'], color: const Color(0xFFD97706)),
                        ],
                      ),
                      const SizedBox(height: 24),
                      const Text('Description', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                      const SizedBox(height: 8),
                      Text(_job!['job_desc'] ?? 'No description', style: TextStyle(color: Colors.grey.shade700, height: 1.5)),
                      const SizedBox(height: 16),
                      const Text('Skills Required', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                      const SizedBox(height: 8),
                      Text(_job!['job_skills'] ?? '', style: TextStyle(color: Colors.grey.shade700)),
                      if (_job!['job_salary'] != null) ...[
                        const SizedBox(height: 16),
                        const Text('Salary', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                        const SizedBox(height: 8),
                        Text(_job!['job_salary'], style: TextStyle(color: Colors.grey.shade700)),
                      ],
                      const SizedBox(height: 32),
                      SizedBox(
                        width: double.infinity,
                        child: ElevatedButton(
                          onPressed: () async {
                            try {
                              final api = Provider.of<ApiService>(context, listen: false);
                              await api.post('/application/${widget.jobId}', {});
                              if (!mounted) return;
                              ScaffoldMessenger.of(context).showSnackBar(
                                const SnackBar(content: Text('Applied!'), backgroundColor: Colors.green),
                              );
                            } catch (e) {
                              ScaffoldMessenger.of(context).showSnackBar(
                                SnackBar(content: Text('$e'), backgroundColor: Colors.red),
                              );
                            }
                          },
                          child: const Text('Apply for this Job'),
                        ),
                      ),
                    ],
                  ),
                ),
    );
  }
}

class _Chip extends StatelessWidget {
  final String label;
  final Color color;
  const _Chip({required this.label, required this.color});
  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(color: color.withOpacity(0.1), borderRadius: BorderRadius.circular(20)),
      child: Text(label, style: TextStyle(fontSize: 12, color: color, fontWeight: FontWeight.w500)),
    );
  }
}
