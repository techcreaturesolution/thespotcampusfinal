class JobFinderConstants {
  static const List<Map<String, String>> categories = [
    {'key': 'it_software', 'label': 'IT & Software'},
    {'key': 'sales_bd', 'label': 'Sales & Business Development'},
    {'key': 'marketing', 'label': 'Marketing & Digital Marketing'},
    {'key': 'hr', 'label': 'HR & Recruitment'},
    {'key': 'finance', 'label': 'Accounts & Finance'},
    {'key': 'banking', 'label': 'Banking & Insurance'},
    {'key': 'bpo', 'label': 'Customer Support / BPO / Telecaller'},
    {'key': 'back_office', 'label': 'Back Office & Data Entry'},
    {'key': 'healthcare', 'label': 'Healthcare & Pharma'},
    {'key': 'education', 'label': 'Teaching & Education'},
    {'key': 'engineering', 'label': 'Engineering & Manufacturing'},
    {'key': 'construction', 'label': 'Construction & Real Estate'},
    {'key': 'technician', 'label': 'Technician / Electrician / ITI'},
    {'key': 'delivery', 'label': 'Delivery, Driver & Logistics'},
    {'key': 'retail', 'label': 'Retail & Store'},
    {'key': 'hospitality', 'label': 'Hotel, Restaurant & Hospitality'},
    {'key': 'design', 'label': 'Design & Creative'},
    {'key': 'legal', 'label': 'Legal'},
    {'key': 'security', 'label': 'Security Guard & Facility'},
    {'key': 'government', 'label': 'Government Jobs'},
    {'key': 'part_time', 'label': 'Part-time & Work from Home'},
    {'key': 'internship', 'label': 'Internship'},
  ];

  static const List<Map<String, String>> education = [
    {'key': 'any', 'label': 'Any Qualification'},
    {'key': '10th', 'label': '10th pass'},
    {'key': '12th', 'label': '12th pass'},
    {'key': 'iti', 'label': 'ITI'},
    {'key': 'diploma', 'label': 'Diploma / Polytechnic'},
    {'key': 'graduate', 'label': 'Any graduate'},
    {'key': 'be_btech', 'label': 'B.E. / B.Tech'},
    {'key': 'bcom', 'label': 'B.Com'},
    {'key': 'bsc', 'label': 'B.Sc'},
    {'key': 'bca', 'label': 'BCA'},
    {'key': 'bba', 'label': 'BBA / BMS'},
    {'key': 'ba', 'label': 'B.A.'},
    {'key': 'nursing', 'label': 'Nursing (GNM / ANM / B.Sc Nursing)'},
    {'key': 'pharmacy', 'label': 'Pharmacy (D.Pharm / B.Pharm)'},
    {'key': 'medical', 'label': 'MBBS / BDS / AYUSH'},
    {'key': 'law', 'label': 'LLB / LLM'},
    {'key': 'postgraduate', 'label': 'Any post graduate'},
    {'key': 'mba', 'label': 'MBA / PGDM'},
    {'key': 'mca', 'label': 'MCA'},
    {'key': 'me_mtech', 'label': 'M.E. / M.Tech'},
    {'key': 'mcom', 'label': 'M.Com'},
    {'key': 'msc', 'label': 'M.Sc'},
    {'key': 'ca_cs', 'label': 'CA / CS / CMA'},
    {'key': 'phd', 'label': 'PhD'},
  ];

  static const List<Map<String, dynamic>> postedWithinOptions = [
    {'value': 30, 'label': 'Last 30 Days'},
    {'value': 7, 'label': 'Last 7 Days'},
    {'value': 3, 'label': 'Last 3 Days'},
    {'value': 1, 'label': 'Last 24 Hours'},
    {'value': 0, 'label': 'Any time'},
  ];

  static const List<String> states = [
    'Andhra Pradesh',
    'Arunachal Pradesh',
    'Assam',
    'Bihar',
    'Chhattisgarh',
    'Goa',
    'Gujarat',
    'Haryana',
    'Himachal Pradesh',
    'Jharkhand',
    'Karnataka',
    'Kerala',
    'Madhya Pradesh',
    'Maharashtra',
    'Manipur',
    'Meghalaya',
    'Mizoram',
    'Nagaland',
    'Odisha',
    'Punjab',
    'Rajasthan',
    'Sikkim',
    'Tamil Nadu',
    'Telangana',
    'Tripura',
    'Uttar Pradesh',
    'Uttarakhand',
    'West Bengal',
    'Andaman and Nicobar Islands',
    'Chandigarh',
    'Dadra and Nagar Haveli and Daman and Diu',
    'Delhi',
    'Jammu and Kashmir',
    'Ladakh',
    'Lakshadweep',
    'Puducherry',
  ];

  static const Map<String, List<String>> citiesByState = {
    'Andhra Pradesh': ['Visakhapatnam', 'Vijayawada', 'Guntur', 'Nellore', 'Tirupati', 'Kakinada', 'Kurnool'],
    'Arunachal Pradesh': ['Itanagar', 'Naharlagun', 'Pasighat'],
    'Assam': ['Guwahati', 'Silchar', 'Dibrugarh', 'Jorhat', 'Tezpur'],
    'Bihar': ['Patna', 'Gaya', 'Bhagalpur', 'Muzaffarpur', 'Darbhanga', 'Purnia'],
    'Chhattisgarh': ['Raipur', 'Bhilai', 'Bilaspur', 'Korba', 'Durg'],
    'Goa': ['Panaji', 'Margao', 'Vasco da Gama', 'Mapusa'],
    'Gujarat': ['Ahmedabad', 'Surat', 'Vadodara', 'Rajkot', 'Gandhinagar', 'Bhavnagar', 'Jamnagar', 'Anand', 'Mehsana', 'Vapi', 'Bharuch', 'Junagadh'],
    'Haryana': ['Gurugram', 'Faridabad', 'Panipat', 'Ambala', 'Karnal', 'Hisar', 'Rohtak', 'Sonipat'],
    'Himachal Pradesh': ['Shimla', 'Solan', 'Dharamshala', 'Mandi', 'Baddi'],
    'Jharkhand': ['Ranchi', 'Jamshedpur', 'Dhanbad', 'Bokaro', 'Hazaribagh'],
    'Karnataka': ['Bengaluru', 'Mysuru', 'Mangaluru', 'Hubballi', 'Belagavi', 'Kalaburagi', 'Davanagere'],
    'Kerala': ['Kochi', 'Thiruvananthapuram', 'Kozhikode', 'Thrissur', 'Kollam', 'Kannur'],
    'Madhya Pradesh': ['Indore', 'Bhopal', 'Jabalpur', 'Gwalior', 'Ujjain', 'Sagar'],
    'Maharashtra': ['Mumbai', 'Pune', 'Nagpur', 'Thane', 'Navi Mumbai', 'Nashik', 'Aurangabad', 'Solapur', 'Kolhapur', 'Amravati'],
    'Manipur': ['Imphal'],
    'Meghalaya': ['Shillong'],
    'Mizoram': ['Aizawl'],
    'Nagaland': ['Kohima', 'Dimapur'],
    'Odisha': ['Bhubaneswar', 'Cuttack', 'Rourkela', 'Sambalpur', 'Berhampur'],
    'Punjab': ['Ludhiana', 'Amritsar', 'Jalandhar', 'Mohali', 'Patiala', 'Bathinda'],
    'Rajasthan': ['Jaipur', 'Jodhpur', 'Udaipur', 'Kota', 'Ajmer', 'Bikaner', 'Alwar', 'Bhilwara'],
    'Sikkim': ['Gangtok'],
    'Tamil Nadu': ['Chennai', 'Coimbatore', 'Madurai', 'Tiruchirappalli', 'Salem', 'Tiruppur', 'Vellore', 'Hosur'],
    'Telangana': ['Hyderabad', 'Warangal', 'Nizamabad', 'Karimnagar', 'Khammam'],
    'Tripura': ['Agartala'],
    'Uttar Pradesh': ['Lucknow', 'Noida', 'Greater Noida', 'Ghaziabad', 'Kanpur', 'Agra', 'Varanasi', 'Prayagraj', 'Meerut', 'Bareilly', 'Gorakhpur', 'Aligarh'],
    'Uttarakhand': ['Dehradun', 'Haridwar', 'Roorkee', 'Haldwani', 'Rudrapur'],
    'West Bengal': ['Kolkata', 'Howrah', 'Durgapur', 'Asansol', 'Siliguri', 'Kharagpur'],
    'Andaman and Nicobar Islands': ['Port Blair'],
    'Chandigarh': ['Chandigarh'],
    'Dadra and Nagar Haveli and Daman and Diu': ['Silvassa', 'Daman', 'Diu'],
    'Delhi': ['New Delhi', 'Delhi'],
    'Jammu and Kashmir': ['Srinagar', 'Jammu'],
    'Ladakh': ['Leh', 'Kargil'],
    'Lakshadweep': ['Kavaratti'],
    'Puducherry': ['Puducherry', 'Karaikal'],
  };

  static List<String> get allCities {
    final list = <String>{};
    for (var cities in citiesByState.values) {
      list.addAll(cities);
    }
    final sorted = list.toList()..sort();
    return sorted;
  }

  static List<String> getCitiesForState(String state) {
    if (state.trim().isEmpty) return allCities;
    return citiesByState[state.trim()] ?? allCities;
  }
}
