import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../services/auth_service.dart';
import '../services/api_service.dart';

class ProfileScreen extends StatelessWidget {
  const ProfileScreen({super.key});

  List<String> _parseSkills(String? skillsStr) {
    if (skillsStr == null || skillsStr.trim().isEmpty) return [];
    return skillsStr.split(',').map((s) => s.trim()).where((s) => s.isNotEmpty).toList();
  }

  @override
  Widget build(BuildContext context) {
    final auth = Provider.of<AuthService>(context);
    final user = auth.user;

    final phone = user?['student_contact'] ?? '-';
    final linkedin = user?['student_linkedin'] ?? '-';
    final email = auth.userEmail.isNotEmpty ? auth.userEmail : '-';
    final enrollment = user?['student_enrollment'] ?? '-';
    final semester = user?['student_current_sem'] != null
        ? '${user?['student_current_sem']}th Semester'
        : '-';

    final branch = user?['branch_id'] is Map
        ? (user?['branch_id']?['branch_name'] ?? '-')
        : '-';
    final degree = user?['degree_id'] is Map
        ? (user?['degree_id']?['degree_name'] ?? '-')
        : '-';
    final college = user?['college_id'] is Map
        ? (user?['college_id']?['college_name'] ?? '-')
        : '-';

    final skillsList = _parseSkills(user?['student_skills']);

    return Scaffold(
      backgroundColor: const Color(0xFFF9FAFB),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        scrolledUnderElevation: 0,
        automaticallyImplyLeading: false,
        title: Align(
          alignment: Alignment.centerLeft,
          child: Image.asset(
            'assets/images/logo_TSC.png',
            height: 32,
            fit: BoxFit.contain,
          ),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.notifications_none, color: Color(0xFF4B5563)),
            onPressed: () {},
          ),
          Padding(
            padding: const EdgeInsets.only(right: 16.0, left: 8.0),
            child: CircleAvatar(
              radius: 18,
              backgroundColor: const Color(0xFF2563EB).withOpacity(0.1),
              child: Text(
                auth.userName.isNotEmpty ? auth.userName[0].toUpperCase() : 'S',
                style: const TextStyle(
                  color: Color(0xFF2563EB),
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            const SizedBox(height: 16),
            
            // Avatar with overlap edit icon
            Center(
              child: Stack(
                children: [
                  CircleAvatar(
                    radius: 60,
                    backgroundColor: const Color(0xFF2563EB).withOpacity(0.1),
                    child: Text(
                      auth.userName.isNotEmpty ? auth.userName[0].toUpperCase() : 'S',
                      style: const TextStyle(
                        fontSize: 48,
                        fontWeight: FontWeight.bold,
                        color: Color(0xFF2563EB),
                      ),
                    ),
                  ),
                  Positioned(
                    bottom: 0,
                    right: 4,
                    child: GestureDetector(
                      onTap: () => _showEditProfileSheet(context, user),
                      child: Container(
                        padding: const EdgeInsets.all(8),
                        decoration: const BoxDecoration(
                          color: Color(0xFF2563EB),
                          shape: BoxShape.circle,
                        ),
                        child: const Icon(
                          Icons.edit,
                          color: Colors.white,
                          size: 18,
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),

            // Name and Email
            Text(
              auth.userName,
              style: const TextStyle(
                fontSize: 24,
                fontWeight: FontWeight.bold,
                color: Color(0xFF111827),
              ),
            ),
            const SizedBox(height: 4),
            Text(
              email,
              style: TextStyle(
                fontSize: 14,
                color: Colors.grey.shade600,
              ),
            ),
            const SizedBox(height: 16),

            // Edit Profile Button
            SizedBox(
              width: 140,
              height: 38,
              child: ElevatedButton(
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF2563EB),
                  foregroundColor: Colors.white,
                  elevation: 0,
                  shape: const StadiumBorder(),
                  padding: EdgeInsets.zero,
                ),
                onPressed: () => _showEditProfileSheet(context, user),
                child: const Text(
                  'Edit Profile',
                  style: TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ),
            const SizedBox(height: 24),

            // Subscription Card
            _ProfileCard(
              title: 'My Placement Subscription',
              icon: Icons.card_membership,
              child: InkWell(
                onTap: () {
                  Navigator.pushNamed(context, '/plans');
                },
                child: Row(
                  children: [
                    const Icon(Icons.star, color: Colors.orange, size: 24),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'Active Plans & Packages',
                            style: TextStyle(
                              fontWeight: FontWeight.bold,
                              fontSize: 14,
                              color: Color(0xFF1F2937),
                            ),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            'Tap to view details and pricing',
                            style: TextStyle(
                              color: Colors.grey.shade500,
                              fontSize: 12,
                            ),
                          ),
                        ],
                      ),
                    ),
                    const Icon(Icons.chevron_right, color: Colors.grey),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),

            // Contact Details Card
            _ProfileCard(
              title: 'Contact Details',
              icon: Icons.contact_mail_outlined,
              child: Column(
                children: [
                  _ContactRow(
                    icon: Icons.phone_outlined,
                    label: 'Phone',
                    value: phone,
                  ),
                  const Divider(height: 20),
                  _ContactRow(
                    icon: Icons.link_outlined,
                    label: 'LinkedIn',
                    value: linkedin,
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),

            // Education Card
            _ProfileCard(
              title: 'Education',
              icon: Icons.school_outlined,
              child: Column(
                children: [
                  _EducationBox(label: 'ENROLLMENT ID', value: enrollment),
                  const SizedBox(height: 12),
                  _EducationBox(label: 'SEMESTER', value: semester),
                  const SizedBox(height: 12),
                  _EducationBox(label: 'BRANCH', value: branch),
                  const SizedBox(height: 12),
                  _EducationBox(label: 'DEGREE', value: degree),
                  const SizedBox(height: 12),
                  _EducationBox(label: 'COLLEGE', value: college),
                ],
              ),
            ),
            const SizedBox(height: 16),

            // Skills Card
            _ProfileCard(
              title: 'Skills',
              icon: Icons.star_outline,
              child: skillsList.isEmpty
                  ? const Text('No skills listed yet', style: TextStyle(color: Colors.grey))
                  : Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: skillsList.map((skill) {
                        return Container(
                          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                          decoration: BoxDecoration(
                            color: const Color(0xFFEFF6FF),
                            borderRadius: BorderRadius.circular(20),
                          ),
                          child: Text(
                            skill,
                            style: const TextStyle(
                              color: Color(0xFF2563EB),
                              fontWeight: FontWeight.bold,
                              fontSize: 12,
                            ),
                          ),
                        );
                      }).toList(),
                    ),
            ),
            const SizedBox(height: 16),

            const SizedBox(height: 24),

            // Logout Button
            SizedBox(
              width: double.infinity,
              height: 48,
              child: OutlinedButton.icon(
                icon: const Icon(Icons.logout, color: Color(0xFFDC2626), size: 18),
                label: const Text(
                  'Logout',
                  style: TextStyle(
                    color: Color(0xFFDC2626),
                    fontWeight: FontWeight.bold,
                    fontSize: 14,
                  ),
                ),
                style: OutlinedButton.styleFrom(
                  side: const BorderSide(color: Color(0xFFDC2626), width: 1.5),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
                onPressed: () async {
                  await auth.logout();
                  if (context.mounted) Navigator.pushReplacementNamed(context, '/login');
                },
              ),
            ),
            const SizedBox(height: 24),
          ],
        ),
      ),
    );
  }

  void _showEditProfileSheet(BuildContext context, Map<String, dynamic>? user) {
    if (user == null) return;
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (context) => _EditProfileBottomSheet(initialUser: user),
    ).then((updated) {
      if (updated == true && context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Profile updated successfully!'),
            backgroundColor: Color(0xFF059669),
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
    });
  }
}

class _ProfileCard extends StatelessWidget {
  final String title;
  final IconData icon;
  final Widget child;

  const _ProfileCard({
    required this.title,
    required this.icon,
    required this.child,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      elevation: 0,
      margin: EdgeInsets.zero,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
        side: BorderSide(color: Colors.grey.shade200),
      ),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(icon, color: const Color(0xFF2563EB), size: 20),
                const SizedBox(width: 8),
                Text(
                  title,
                  style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                    color: Color(0xFF1F2937),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            child,
          ],
        ),
      ),
    );
  }
}

class _ContactRow extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;

  const _ContactRow({
    required this.icon,
    required this.label,
    required this.value,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Icon(icon, color: Colors.grey.shade500, size: 18),
        const SizedBox(width: 10),
        Text(
          label,
          style: TextStyle(
            color: Colors.grey.shade500,
            fontSize: 14,
            fontWeight: FontWeight.w500,
          ),
        ),
        const Spacer(),
        Text(
          value,
          style: const TextStyle(
            color: Color(0xFF2563EB),
            fontWeight: FontWeight.bold,
            fontSize: 14,
          ),
        ),
      ],
    );
  }
}

class _EducationBox extends StatelessWidget {
  final String label;
  final String value;

  const _EducationBox({
    required this.label,
    required this.value,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: const Color(0xFFF5F7FF),
        borderRadius: BorderRadius.circular(10),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label,
            style: TextStyle(
              fontSize: 10,
              fontWeight: FontWeight.bold,
              color: Colors.grey.shade500,
            ),
          ),
          const SizedBox(height: 2),
          Text(
            value,
            style: const TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.bold,
              color: Color(0xFF1F2937),
            ),
          ),
        ],
      ),
    );
  }
}

class _EditProfileBottomSheet extends StatefulWidget {
  final Map<String, dynamic> initialUser;

  const _EditProfileBottomSheet({required this.initialUser});

  @override
  State<_EditProfileBottomSheet> createState() => _EditProfileBottomSheetState();
}

class _EditProfileBottomSheetState extends State<_EditProfileBottomSheet> {
  final _formKey = GlobalKey<FormState>();
  late TextEditingController _nameController;
  late TextEditingController _contactController;
  late TextEditingController _linkedinController;
  late TextEditingController _skillsController;
  bool _isSaving = false;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    _nameController = TextEditingController(text: widget.initialUser['student_name'] ?? '');
    _contactController = TextEditingController(text: widget.initialUser['student_contact'] ?? '');
    _linkedinController = TextEditingController(text: widget.initialUser['student_linkedin'] ?? '');
    _skillsController = TextEditingController(text: widget.initialUser['student_skills'] ?? '');
  }

  @override
  void dispose() {
    _nameController.dispose();
    _contactController.dispose();
    _linkedinController.dispose();
    _skillsController.dispose();
    super.dispose();
  }

  Future<void> _saveProfile() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() {
      _isSaving = true;
      _errorMessage = null;
    });

    try {
      final api = Provider.of<ApiService>(context, listen: false);
      final auth = Provider.of<AuthService>(context, listen: false);

      await api.patch('/users/update-profile', {
        'student_name': _nameController.text.trim(),
        'student_contact': _contactController.text.trim(),
        'student_linkedin': _linkedinController.text.trim(),
        'student_skills': _skillsController.text.trim(),
      });

      // Refresh auth state to update profile details across the app
      await auth.checkAuth();

      if (!mounted) return;
      Navigator.pop(context, true);
    } catch (e) {
      setState(() {
        _errorMessage = e.toString().replaceAll('Exception: ', '');
        _isSaving = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.only(
        top: 20,
        left: 20,
        right: 20,
        bottom: MediaQuery.of(context).viewInsets.bottom + 20,
      ),
      child: Form(
        key: _formKey,
        child: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text(
                    'Edit Profile Details',
                    style: TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                      color: Color(0xFF1F2937),
                    ),
                  ),
                  IconButton(
                    icon: const Icon(Icons.close),
                    onPressed: () => Navigator.pop(context),
                  ),
                ],
              ),
              const Divider(),
              const SizedBox(height: 16),
              if (_errorMessage != null) ...[
                Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: Colors.red.shade50,
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: Colors.red.shade200),
                  ),
                  child: Text(
                    _errorMessage!,
                    style: TextStyle(color: Colors.red.shade800, fontSize: 13),
                  ),
                ),
                const SizedBox(height: 16),
              ],
              const Text(
                'Full Name',
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                  color: Color(0xFF4B5563),
                ),
              ),
              const SizedBox(height: 6),
              TextFormField(
                controller: _nameController,
                decoration: const InputDecoration(
                  hintText: 'Enter your full name',
                ),
                validator: (value) {
                  if (value == null || value.trim().isEmpty) {
                    return 'Please enter your name';
                  }
                  return null;
                },
              ),
              const SizedBox(height: 16),
              const Text(
                'Contact Number',
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                  color: Color(0xFF4B5563),
                ),
              ),
              const SizedBox(height: 6),
              TextFormField(
                controller: _contactController,
                keyboardType: TextInputType.phone,
                decoration: const InputDecoration(
                  hintText: 'Enter your contact number',
                ),
                validator: (value) {
                  if (value == null || value.trim().isEmpty) {
                    return 'Please enter your contact number';
                  }
                  return null;
                },
              ),
              const SizedBox(height: 16),
              const Text(
                'LinkedIn Profile ID or Link',
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                  color: Color(0xFF4B5563),
                ),
              ),
              const SizedBox(height: 6),
              TextFormField(
                controller: _linkedinController,
                decoration: const InputDecoration(
                  hintText: 'e.g. linkedin.com/in/yourname',
                ),
              ),
              const SizedBox(height: 16),
              const Text(
                'Skills (comma separated)',
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                  color: Color(0xFF4B5563),
                ),
              ),
              const SizedBox(height: 6),
              TextFormField(
                controller: _skillsController,
                maxLines: 2,
                decoration: const InputDecoration(
                  hintText: 'e.g. Flutter, Dart, Node.js',
                ),
              ),
              const SizedBox(height: 24),
              SizedBox(
                height: 48,
                child: ElevatedButton(
                  onPressed: _isSaving ? null : _saveProfile,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF2563EB),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                  child: _isSaving
                      ? const SizedBox(
                          height: 20,
                          width: 20,
                          child: CircularProgressIndicator(
                            strokeWidth: 2.5,
                            valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                          ),
                        )
                      : const Text(
                          'Save Changes',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
