String _s(dynamic v) => v == null ? '' : v.toString();

List<String> _list(dynamic v) => v is List
    ? v.map(_s).where((e) => e.isNotEmpty).toSet().toList()
    : const [];

DateTime? _date(dynamic v) =>
    v == null ? null : DateTime.tryParse(v.toString())?.toLocal();

class MarketJobOption {
  const MarketJobOption({required this.key, required this.label});
  final String key;
  final String label;

  factory MarketJobOption.fromJson(Map<String, dynamic> j) =>
      MarketJobOption(key: _s(j['key']), label: _s(j['label']));
}

class MarketJobMeta {
  MarketJobMeta({
    required this.categories,
    required this.education,
    required this.levels,
    required this.states,
    required this.postedWithin,
    required this.dailyLimit,
  });

  final List<MarketJobOption> categories;
  final List<MarketJobOption> education;
  final List<String> levels;
  final List<String> states;
  final List<int> postedWithin;
  final int dailyLimit;

  factory MarketJobMeta.fromJson(Map<String, dynamic> j) => MarketJobMeta(
        categories: (j['categories'] as List? ?? [])
            .map((e) => MarketJobOption.fromJson(e as Map<String, dynamic>))
            .toList(),
        education: (j['education'] as List? ?? [])
            .map((e) => MarketJobOption.fromJson(e as Map<String, dynamic>))
            .toList(),
        levels: _list(j['levels']),
        states: _list(j['states']),
        postedWithin: (j['postedWithin'] as List? ?? [])
            .map((e) => (e as num).toInt())
            .toList(),
        dailyLimit: (j['dailyLimit'] as num?)?.toInt() ?? 10,
      );
}

class MarketApplyOption {
  const MarketApplyOption({required this.title, required this.link});
  final String title;
  final String link;
}

class MarketJob {
  MarketJob({
    required this.id,
    required this.title,
    required this.companyName,
    required this.companyWebsite,
    required this.level,
    required this.experienceText,
    required this.education,
    required this.educationText,
    required this.description,
    required this.location,
    required this.city,
    required this.state,
    required this.address,
    required this.employmentType,
    required this.salary,
    required this.workFromHome,
    required this.postedAt,
    required this.postedText,
    required this.validThrough,
    required this.platform,
    required this.applyUrl,
    required this.applyOptions,
    required this.emails,
    required this.phones,
    required this.verified,
    required this.verificationMethod,
  });

  final String id;
  final String title;
  final String companyName;
  final String companyWebsite;
  final String level;
  final String experienceText;
  final List<String> education;
  final String educationText;
  final String description;
  final String location;
  final String city;
  final String state;
  final String address;
  final String employmentType;
  final String salary;
  final bool workFromHome;
  final DateTime? postedAt;
  final String postedText;
  final DateTime? validThrough;
  final String platform;
  final String applyUrl;
  final List<MarketApplyOption> applyOptions;
  final List<String> emails;
  final List<String> phones;
  final bool verified;
  final String verificationMethod;

  factory MarketJob.fromJson(Map<String, dynamic> j) {
    final seen = <String>{};
    final options = <MarketApplyOption>[];
    final directApplyUrl = _s(j['applyUrl']);

    final raw = [
      if (directApplyUrl.isNotEmpty)
        {'title': j['via'] ?? j['platform'] ?? 'Direct Apply', 'link': directApplyUrl},
      ...(j['applyOptions'] as List? ?? []),
    ];

    for (final o in raw.cast<Map>()) {
      final link = _s(o['link']);
      if (link.isNotEmpty && seen.add(link)) {
        options.add(
          MarketApplyOption(
            title: _s(o['title']).isEmpty ? 'Apply' : _s(o['title']),
            link: link,
          ),
        );
      }
    }

    final verification = j['verification'] as Map? ?? const {};

    return MarketJob(
      id: _s(j['_id']),
      title: _s(j['title']),
      companyName: _s(j['companyName']),
      companyWebsite: _s(j['companyWebsite']),
      level: _s(j['level']),
      experienceText: _s(j['experienceText']),
      education: _list(j['education']),
      educationText: _s(j['educationText']),
      description: _s(j['description']),
      location: _s(j['location']),
      city: _s(j['city']),
      state: _s(j['state']),
      address: _s(j['address']),
      employmentType: _s(j['employmentType']),
      salary: _s(j['salary']),
      workFromHome: j['workFromHome'] == true,
      postedAt: _date(j['postedAt']),
      postedText: _s(j['postedText']),
      validThrough: _date(j['validThrough']),
      platform: _s(j['platform']),
      applyUrl: directApplyUrl,
      applyOptions: options,
      emails: _list((j['emails'] as List? ?? const []).map((e) => _s(e).toLowerCase()).toList()),
      phones: _list(j['phones']),
      verified: verification['status'] == 'verified',
      verificationMethod: _s(verification['method']),
    );
  }
}

class MarketJobSearch {
  MarketJobSearch({
    required this.id,
    required this.prompt,
    required this.query,
    required this.level,
    required this.state,
    required this.city,
    required this.category,
    required this.education,
    required this.status,
    required this.error,
    required this.resultCount,
    required this.durationMs,
    required this.createdAt,
  });

  final String id;
  final String prompt;
  final String query;
  final String level;
  final String state;
  final String city;
  final String category;
  final String education;
  final String status;
  final String error;
  final int resultCount;
  final int durationMs;
  final DateTime? createdAt;

  factory MarketJobSearch.fromJson(Map<String, dynamic> j) => MarketJobSearch(
        id: _s(j['_id']),
        prompt: _s(j['prompt']),
        query: _s(j['query']),
        level: _s(j['level']),
        state: _s(j['state']),
        city: _s(j['city']),
        category: _s(j['category']),
        education: _s(j['education']),
        status: _s(j['status']),
        error: _s(j['error']),
        resultCount: (j['resultCount'] as num?)?.toInt() ?? 0,
        durationMs: (j['durationMs'] as num?)?.toInt() ?? 0,
        createdAt: _date(j['createdAt']),
      );
}
