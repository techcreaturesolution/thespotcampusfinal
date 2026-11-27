import 'package:flutter/foundation.dart';
import '../models/technical_skill_models.dart';
import 'api_service.dart';

class TechnicalSkillsService extends ChangeNotifier {
  final ApiService _apiService;

  TechnicalSkillsService(this._apiService);

  List<StudentSkillModel> _skills = [];
  List<SkillMasterModel> _searchResults = [];
  List<ProficiencyLevelModel> _proficiencyLevels = SkillValidators.proficiencyLevels;
  bool _isLoading = false;
  bool _isSearching = false;
  bool _isSaving = false;
  String? _errorMessage;

  List<StudentSkillModel> get skills => _skills;
  List<SkillMasterModel> get searchResults => _searchResults;
  List<ProficiencyLevelModel> get proficiencyLevels => _proficiencyLevels;
  bool get isLoading => _isLoading;
  bool get isSearching => _isSearching;
  bool get isSaving => _isSaving;
  String? get errorMessage => _errorMessage;

  Future<void> loadMySkills({String proficiencyFilter = '', String sortBy = 'display_order'}) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final params = <String, String>{};
      if (proficiencyFilter.isNotEmpty) params['proficiency'] = proficiencyFilter;
      if (sortBy.isNotEmpty) params['sort'] = sortBy;
      final qs = params.isEmpty ? '' : '?${Uri(queryParameters: params).query}';

      final res = await _apiService.get('/skills/me$qs');
      final raw = res['skills'] as List? ?? [];
      _skills = raw
          .whereType<Map<String, dynamic>>()
          .map(StudentSkillModel.fromJson)
          .toList();

      final rawLevels = res['proficiency_levels'] as List?;
      if (rawLevels != null && rawLevels.isNotEmpty) {
        final parsed = rawLevels
            .whereType<Map<String, dynamic>>()
            .map(ProficiencyLevelModel.fromJson)
            .toList()
          ..sort((a, b) => a.order.compareTo(b.order));
        if (parsed.isNotEmpty) _proficiencyLevels = parsed;
      }
    } catch (e) {
      _errorMessage = e.toString().replaceAll('Exception: ', '');
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<List<SkillMasterModel>> searchCatalog({String query = '', String category = ''}) async {
    _isSearching = true;
    notifyListeners();
    try {
      final params = <String, String>{'limit': '25'};
      if (query.trim().isNotEmpty) params['q'] = query.trim();
      if (category.isNotEmpty) params['category'] = category;
      final qs = Uri(queryParameters: params).query;
      final res = await _apiService.get('/skills/master?$qs');
      final raw = res['skills'] as List? ?? [];
      _searchResults = raw
          .whereType<Map<String, dynamic>>()
          .map(SkillMasterModel.fromJson)
          .toList();
      return _searchResults;
    } finally {
      _isSearching = false;
      notifyListeners();
    }
  }

  Future<void> addSkill({
    required String skillId,
    required String proficiency,
    double? yearsOfExperience,
  }) async {
    _isSaving = true;
    notifyListeners();
    try {
      await _apiService.post('/skills/me', {
        'skill_id': skillId,
        'proficiency': proficiency,
        if (yearsOfExperience != null) 'years_of_experience': yearsOfExperience,
      });
      await loadMySkills();
    } finally {
      _isSaving = false;
      notifyListeners();
    }
  }

  Future<void> updateSkill({
    required String userSkillId,
    required String proficiency,
    double? yearsOfExperience,
  }) async {
    _isSaving = true;
    notifyListeners();
    try {
      await _apiService.patch('/skills/me/$userSkillId', {
        'proficiency': proficiency,
        'years_of_experience': yearsOfExperience,
      });
      await loadMySkills();
    } finally {
      _isSaving = false;
      notifyListeners();
    }
  }

  Future<void> removeSkill(String userSkillId) async {
    _isSaving = true;
    notifyListeners();
    try {
      await _apiService.delete('/skills/me/$userSkillId');
      await loadMySkills();
    } finally {
      _isSaving = false;
      notifyListeners();
    }
  }

  Future<void> reorderSkills(List<StudentSkillModel> reordered) async {
    final orders = <Map<String, dynamic>>[];
    for (int i = 0; i < reordered.length; i++) {
      orders.add({'user_skill_id': reordered[i].id, 'display_order': i});
    }
    _skills = reordered;
    notifyListeners();
    await _apiService.patch('/skills/me/reorder', {'orders': orders});
    await loadMySkills();
  }
}
