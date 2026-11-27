import 'package:flutter/material.dart';
import '../models/profile_policy_model.dart';

class ProfilePolicyCard extends StatelessWidget {
  final ProfilePolicyStatusModel? policy;
  final bool isLoading;
  final bool isMutating;
  final String? errorMessage;
  final VoidCallback onRefresh;
  final Future<void> Function(String visibility) onChangeVisibility;

  const ProfilePolicyCard({
    super.key,
    required this.policy,
    required this.isLoading,
    required this.isMutating,
    required this.errorMessage,
    required this.onRefresh,
    required this.onChangeVisibility,
  });

  Color _stateColor(String state) {
    switch (state) {
      case 'PUBLISHED':
        return const Color(0xFF10B981);
      case 'VALID':
        return const Color(0xFF3730A3);
      case 'SUSPENDED':
      case 'INVALID':
        return const Color(0xFFDC2626);
      default:
        return const Color(0xFF64748B);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (isLoading && policy == null) {
      return Container(
        margin: const EdgeInsets.only(bottom: 20),
        padding: const EdgeInsets.all(18),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: Colors.grey.shade200),
        ),
        child: const Row(
          children: [
            SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2)),
            SizedBox(width: 12),
            Text('Evaluating profile validation & visibility...', style: TextStyle(fontSize: 13)),
          ],
        ),
      );
    }

    final data = policy;
    if (data == null && errorMessage != null) {
      return Container(
        margin: const EdgeInsets.only(bottom: 20),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: const Color(0xFFFEF2F2),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: const Color(0xFFFECACA)),
        ),
        child: Row(
          children: [
            const Icon(Icons.error_outline, color: Color(0xFFDC2626)),
            const SizedBox(width: 12),
            Expanded(
              child: Text(
                errorMessage!,
                style: const TextStyle(fontSize: 12, color: Color(0xFF991B1B)),
              ),
            ),
            TextButton(onPressed: onRefresh, child: const Text('Retry')),
          ],
        ),
      );
    }

    if (data == null) return const SizedBox.shrink();

    final color = _stateColor(data.profileState);

    return Container(
      margin: const EdgeInsets.only(bottom: 20),
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(22),
        border: Border.all(color: Colors.grey.shade200),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.04),
            blurRadius: 14,
            offset: const Offset(0, 6),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.verified_user_outlined, color: Color(0xFF3730A3), size: 20),
              const SizedBox(width: 8),
              const Expanded(
                child: Text(
                  'Validation & Visibility',
                  style: TextStyle(fontSize: 15, fontWeight: FontWeight.w800),
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 3),
                decoration: BoxDecoration(
                  color: color.withOpacity(0.12),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Text(
                  data.profileState,
                  style: TextStyle(fontSize: 10, fontWeight: FontWeight.w800, color: color),
                ),
              ),
              IconButton(
                icon: const Icon(Icons.refresh, size: 18),
                onPressed: isMutating ? null : onRefresh,
              ),
            ],
          ),
          Text(
            'Visibility: ${data.profileVisibility} • ${data.publishable ? "Publishable" : "Not publishable"}',
            style: const TextStyle(fontSize: 12, color: Color(0xFF6B7280)),
          ),
          if (errorMessage != null) ...[
            const SizedBox(height: 8),
            Text(
              errorMessage!,
              style: const TextStyle(fontSize: 12, color: Color(0xFFDC2626)),
            ),
          ],
          const SizedBox(height: 12),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: ['Private', 'Institute Only', 'Public'].map((vis) {
              final selected = data.profileVisibility == vis;
              final disabled =
                  isMutating || (vis != 'Private' && (!data.publishable || data.visibilityOverride != 'NONE'));
              return ChoiceChip(
                label: Text(vis, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w700)),
                selected: selected,
                onSelected: disabled ? null : (_) => onChangeVisibility(vis),
              );
            }).toList(),
          ),
          if (data.errors.isNotEmpty) ...[
            const Divider(height: 20),
            Text(
              'Blocking Errors (${data.errors.length})',
              style: const TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w800,
                color: Color(0xFFDC2626),
              ),
            ),
            const SizedBox(height: 6),
            ...data.errors.map(
              (err) => ListTile(
                dense: true,
                contentPadding: EdgeInsets.zero,
                leading: const Icon(Icons.error_outline, color: Color(0xFFDC2626), size: 18),
                title: Text('[${err.code}] ${err.message}', style: const TextStyle(fontSize: 12)),
                trailing: err.mobileRoute.isNotEmpty && err.mobileRoute != '/profile'
                    ? TextButton(
                        onPressed: () =>
                            Navigator.pushNamed(context, err.mobileRoute).then((_) => onRefresh()),
                        child: const Text('Fix'),
                      )
                    : null,
              ),
            ),
          ],
          if (data.warnings.isNotEmpty) ...[
            const SizedBox(height: 8),
            Text(
              'Warnings (${data.warnings.length})',
              style: const TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.w700,
                color: Color(0xFFD97706),
              ),
            ),
            const SizedBox(height: 4),
            ...data.warnings.map(
              (w) => Padding(
                padding: const EdgeInsets.symmetric(vertical: 2),
                child: Text(
                  '• ${w.message}',
                  style: const TextStyle(fontSize: 11, color: Color(0xFF92400E)),
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }
}
