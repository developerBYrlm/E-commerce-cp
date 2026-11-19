/**
 * BANGLADESH ADMINISTRATIVE DATA
 * 8 Divisions, 64 Districts, 495 Upazilas, Metropolitan Thanas, and Additional Thanas
 */

export const BANGLADESH_DIVISIONS = [
  "Dhaka",
  "Chattogram",
  "Rajshahi",
  "Khulna",
  "Barishal",
  "Sylhet",
  "Rangpur",
  "Mymensingh",
];

export const BANGLADESH_ADMINISTRATIVE_DATA = {
  // ========================================================================
  // 1. DHAKA DIVISION (13 Districts)
  // ========================================================================
  Dhaka: {
    division: "Dhaka",
    upazilas: ["Dhamrai", "Dohar", "Keraniganj", "Nawabganj", "Savar"],
    thanas: [
      "Adabor", "Airport", "Badda", "Banani", "Bangshal", "Bhashantek", "Bhatara",
      "Cantonment", "Chawkbazar", "Dakshinkhan", "Darus Salam", "Demra", "Dhanmondi",
      "Gendaria", "Gulshan", "Hatirjheel", "Hazaribagh", "Jatrabari", "Kadamtali",
      "Kafrul", "Kalabagan", "Kamrangirchar", "Khilgaon", "Khilkhet", "Kotwali",
      "Lalbagh", "Mirpur", "Mohammadpur", "Motijheel", "Mugda", "New Market",
      "Pallabi", "Paltan", "Ramna", "Rampura", "Rupnagar", "Sabujbagh", "Shah Ali",
      "Shahbagh", "Shahjahanpur", "Sher-e-Bangla Nagar", "Shyampur", "Sutrapur",
      "Tejgaon", "Tejgaon Industrial Area", "Turag", "Uttara East", "Uttara West",
      "Uttarkhan", "Wari",
    ],
    areas: [
      "Farmgate", "Kawran Bazar", "Karwan Bazar", "Shahbagh", "Shahbag",
      "Agargaon", "Agargaon Taltola", "West Agargaon", "Kalyanpur", "Kallyanpur",
      "Kazipara", "North Kazipara", "South Kazipara", "Shewrapara", "Sheorapara",
      "West Shewrapara", "East Shewrapara", "ECB Chattar", "ECB Square", "Kalshi",
      "Kalshi Mor", "Nodda", "Nadda", "Notun Bazar", "Natun Bazar",
      "Bijoy Sarani", "Khamarbari", "Banglamotor", "Moghbazar",
      "Eskaton", "Katabon", "Science Lab", "Matikata", "Senpara Parbata",
      "Dhanmondi 27", "Dhanmondi 32", "Sobhanbag", "Rayer Bazar", "Jigatola",
      "Gulshan 1", "Gulshan 2", "Niketan", "Banani", "Banani DOHS", "Mohakhali",
      "Mohakhali DOHS", "Mirpur 1", "Mirpur 2", "Mirpur 6", "Mirpur 10", "Mirpur 11",
      "Mirpur 12", "Mirpur 14", "Pallabi", "Mohammadpur",
      "Town Hall", "Lalmatia", "Salimullah Road", "Iqbal Road",
      "Uttara Sector 1", "Uttara Sector 3", "Uttara Sector 4", "Uttara Sector 7",
      "Uttara Sector 9", "Uttara Sector 10", "Uttara Sector 11", "Uttara Sector 12",
      "Uttara Sector 13", "Uttara Sector 14", "Azampur", "Badda", "Middle Badda",
      "North Badda", "South Badda", "Merul Badda", "Aftabnagar", "Rampura",
      "Banasree", "Khilgaon", "Malibagh", "Mouchak", "Shantinagar", "Kakrail",
      "Motijheel", "Dilkusha", "Paltan", "Bijoynagar", "Wari", "Old Dhaka",
      "Lalbagh", "Chawkbazar", "Bangshal", "Sadarghat", "Armanitola", "Islampur",
      "Elephant Road", "New Market", "Azimpur", "Panthapath", "Green Road",
      "Tejgaon", "Nakhalpara", "Baridhara", "Baridhara DOHS",
      "Bashundhara R/A", "Bhatara", "Kuril", "Khilkhet", "Darus Salam",
      "Gabtoli", "Adabor", "Shekhertek", "Hazaribagh", "Kamrangirchar",
      "Jatrabari", "Sayedabad", "Dholairpar", "Jurain", "Postogola", "Demra",
      "Savar Bazar", "Ashulia", "DEPZ", "Hemayetpur", "Dhamrai Bazar",
    ],
  },

  Gazipur: {
    division: "Dhaka",
    upazilas: ["Gazipur Sadar", "Kaliakair", "Kaliganj", "Kapasia", "Sreepur"],
    thanas: [
      "Sadar", "Basan", "Konabari", "Gacha", "Kashimpur", "Pubail", "Tongi East", "Tongi West",
    ],
    areas: [
      "Chowrasta", "Joydebpur", "Board Bazar", "Chandona", "Tongi Bazar", "Station Road Tongi",
      "Konabari", "Kashimpur", "Kaliakair Bazar", "Mouchak Gazipur", "Pubail", "Kapasia Bazar",
      "Sreepur Bazar", "Rajendrapur",
    ],
  },

  Narayanganj: {
    division: "Dhaka",
    upazilas: ["Narayanganj Sadar", "Araihazar", "Bandar", "Rupganj", "Sonargaon"],
    thanas: ["Fatullah", "Siddhirganj"],
    areas: [
      "Chashara", "Mondolpara", "Tanbazar", "Nitaiganj", "Fatullah", "Siddhirganj",
      "Kanchpur", "Signboard Narayanganj", "Sonargaon", "Bhulta", "Gausia", "Bandar",
    ],
  },

  Narsingdi: {
    division: "Dhaka",
    upazilas: ["Narsingdi Sadar", "Belabo", "Monohardi", "Palash", "Raipura", "Shibpur"],
    thanas: ["Madhabdi"],
    areas: ["Madhabdi Bazar", "Velanagar", "Ghorashal", "Shibpur Bazar", "Palash Bazar"],
  },

  Manikganj: {
    division: "Dhaka",
    upazilas: [
      "Manikganj Sadar", "Daulatpur", "Ghior", "Harirampur", "Saturia", "Shibalaya", "Singair",
    ],
    thanas: [],
    areas: ["Manikganj Bazar", "Aricha", "Paturia", "Singair Bazar", "Ghior Bazar"],
  },

  Munshiganj: {
    division: "Dhaka",
    upazilas: ["Munshiganj Sadar", "Gazaria", "Lohajang", "Sirajdikhan", "Sreenagar", "Tongibari"],
    thanas: [],
    areas: ["Munshiganj Town", "Mawa Ghat", "Sirajdikhan Bazar", "Sreenagar Bazar", "Gazaria"],
  },

  Tangail: {
    division: "Dhaka",
    upazilas: [
      "Tangail Sadar", "Basail", "Bhuapur", "Delduar", "Dhanbari", "Ghatail",
      "Gopalpur", "Kalihati", "Madhupur", "Mirzapur", "Nagarpur", "Sakhipur",
    ],
    thanas: ["Bangabandhu Bridge East"],
    areas: ["Tangail Old Bus Stand", "Nirala Mor", "Mirzapur Cadets", "Madhupur Bazar", "Elenga"],
  },

  Kishoreganj: {
    division: "Dhaka",
    upazilas: [
      "Kishoreganj Sadar", "Austagram", "Bajitpur", "Bhairab", "Hossainpur",
      "Itna", "Karimganj", "Katiadi", "Kuliarchar", "Mithamain", "Nikli",
      "Pakundia", "Tarail",
    ],
    thanas: [],
    areas: ["Bhairab Bazar", "Kishoreganj Town", "Katiadi Bazar", "Mithamain Haor", "Nikli Haor"],
  },

  Faridpur: {
    division: "Dhaka",
    upazilas: [
      "Faridpur Sadar", "Alfadanga", "Bhanga", "Boalmari", "Charbhadrasan",
      "Madhukhali", "Nagarkanda", "Sadarpur", "Saltha",
    ],
    thanas: [],
    areas: ["Faridpur Town", "Goalchamot", "Bhanga Junction", "Boalmari Bazar", "Madhukhali"],
  },

  Gopalganj: {
    division: "Dhaka",
    upazilas: ["Gopalganj Sadar", "Kashiani", "Kotalipara", "Muksudpur", "Tungipara"],
    thanas: [],
    areas: ["Gopalganj Sadar", "Tungipara Complex", "Kotalipara", "Bhatiapara", "Muksudpur"],
  },

  Madaripur: {
    division: "Dhaka",
    upazilas: ["Madaripur Sadar", "Dasar", "Kalkini", "Rajoir", "Shibchar"],
    thanas: [],
    areas: ["Madaripur Town", "Shibchar Bazar", "Pachchar", "Rajoir Bazar", "Kalkini"],
  },

  Rajbari: {
    division: "Dhaka",
    upazilas: ["Rajbari Sadar", "Baliakandi", "Goalanda", "Kalukhali", "Pangsha"],
    thanas: [],
    areas: ["Rajbari Town", "Daulatdia Ghat", "Goalanda Bazar", "Pangsha Bazar"],
  },

  Shariatpur: {
    division: "Dhaka",
    upazilas: [
      "Shariatpur Sadar (Palong)", "Bhedarganj", "Damudya", "Gosairhat", "Naria", "Zajira",
    ],
    thanas: ["Sakhipur", "Padma Bridge South"],
    areas: ["Palong Bazar", "Zajira Padma Point", "Naria Bazar", "Bhedarganj"],
  },

  // ========================================================================
  // 2. CHATTOGRAM DIVISION (11 Districts)
  // ========================================================================
  Chattogram: {
    division: "Chattogram",
    upazilas: [
      "Anwara", "Banshkhali", "Boalkhali", "Chandanaish", "Fatikchhari",
      "Hathazari", "Karnaphuli", "Lohagara", "Mirsharai", "Patiya",
      "Rangunia", "Raozan", "Sandwip", "Satkania", "Sitakunda",
    ],
    thanas: [
      "Kotwali", "Panchlaish", "Chandgaon", "Bandar", "Double Mooring",
      "Halishahar", "Pahartali", "Khulshi", "Bakalia", "Patenga", "EPZ",
      "Bayazid Bostami", "Akbarshah", "Sadarghat", "Chawkbazar", "Zorarganj", "Bhujpur",
    ],
    areas: [
      "GEC Circle", "Agrabad C/A", "Nasirabad", "Khulshi", "Chawkbazar Ctg",
      "Halishahar", "Panchlaish", "Muradpur", "Bahaddarhat", "Kotwali Ctg",
      "Patenga Sea Beach", "New Market Ctg", "Sitakunda Bazar", "Hathazari",
      "Bhatiari", "Karnaphuli", "Mirsharai",
    ],
  },

  "Cox's Bazar": {
    division: "Chattogram",
    upazilas: [
      "Cox's Bazar Sadar", "Chakaria", "Eidgaon", "Kutubdia",
      "Maheshkhali", "Pekua", "Ramu", "Teknaf", "Ukhiya",
    ],
    thanas: [],
    areas: ["Kolatoli", "Laboni Beach", "Sugandha Beach", "Teknaf Port", "Inani", "Marine Drive", "Chakaria"],
  },

  Rangamati: {
    division: "Chattogram",
    upazilas: [
      "Rangamati Sadar", "Bagaichhari", "Barkal", "Belaichhari", "Juraichhari",
      "Kaptai", "Kawkhali", "Langadu", "Naniarchar", "Rajasthali",
    ],
    thanas: ["Chandraghona", "Sajek"],
    areas: ["Rangamati Town", "Kaptai Lake", "Sajek Valley", "Tabalchhari", "Banarupa"],
  },

  Bandarban: {
    division: "Chattogram",
    upazilas: [
      "Bandarban Sadar", "Alikadam", "Lama", "Naikhongchhari",
      "Rowangchhari", "Ruma", "Thanchi",
    ],
    thanas: [],
    areas: ["Bandarban Town", "Nilgiri", "Thanchi Bazar", "Ruma Bazar", "Meghla", "Chimbuk"],
  },

  Khagrachhari: {
    division: "Chattogram",
    upazilas: [
      "Khagrachhari Sadar", "Dighinala", "Guimara", "Lakshmichhari",
      "Mahalchhari", "Manikchhari", "Matiranga", "Panchhari", "Ramgarh",
    ],
    thanas: [],
    areas: ["Khagrachhari Town", "Shapla Chattar", "Alutila", "Dighinala Bazar", "Ramgarh Port"],
  },

  Cumilla: {
    division: "Chattogram",
    upazilas: [
      "Cumilla Adarsha Sadar", "Cumilla Sadar Dakshin", "Barura", "Brahmanpara",
      "Burichang", "Chandina", "Chauddagram", "Daudkandi", "Debidwar", "Homna",
      "Laksam", "Lalmai", "Meghna", "Monohorgonj", "Muradnagar", "Nangalkot", "Titas",
    ],
    thanas: ["Bangra Bazar"],
    areas: ["Kandirpar", "Badur Tola", "Shasongachha", "Tomsom Bridge", "Kotbari", "Daudkandi Toll Plaza", "Laksam Junction"],
  },

  Chandpur: {
    division: "Chattogram",
    upazilas: [
      "Chandpur Sadar", "Faridganj", "Haimchar", "Haziganj",
      "Kachua", "Matlab Dakshin", "Matlab Uttar", "Shahrasti",
    ],
    thanas: [],
    areas: ["Chandpur Ghat", "Boro Station", "Haziganj Bazar", "Faridganj", "Matlab"],
  },

  Brahmanbaria: {
    division: "Chattogram",
    upazilas: [
      "Brahmanbaria Sadar", "Akhaura", "Ashuganj", "Bancharampur",
      "Bijoynagar", "Kasba", "Nabinagar", "Nasirnagar", "Sarail",
    ],
    thanas: [],
    areas: ["Kandipara B.Baria", "Ashuganj Power Plant", "Akhaura Land Port", "Sarail Biswa Road", "Kasba Bazar"],
  },

  Noakhali: {
    division: "Chattogram",
    upazilas: [
      "Noakhali Sadar (Sudharam)", "Begumganj", "Chatkhil", "Companiganj",
      "Hatiya", "Kabirhat", "Senbagh", "Sonaimuri", "Subarnachar",
    ],
    thanas: ["Char Jabbar", "Bhasan Char"],
    areas: ["Maijdee Court", "Chowmuhani", "Basurhat", "Sonaimuri Bazar", "Hatiya Island"],
  },

  Lakshmipur: {
    division: "Chattogram",
    upazilas: ["Lakshmipur Sadar", "Kamalnagar", "Raipur", "Ramganj", "Ramgati"],
    thanas: ["Chandraganj"],
    areas: ["Lakshmipur Town", "Raipur Bazar", "Ramganj Town", "Chandraganj", "Ramgati"],
  },

  Feni: {
    division: "Chattogram",
    upazilas: [
      "Feni Sadar", "Chhagalnaiya", "Daganbhuiyan", "Fulgazi", "Parshuram", "Sonagazi",
    ],
    thanas: [],
    areas: ["Trunk Road Feni", "Grand Trunk", "Daganbhuiyan Bazar", "Chhagalnaiya", "Sonagazi"],
  },

  // ========================================================================
  // 3. RAJSHAHI DIVISION (8 Districts)
  // ========================================================================
  Rajshahi: {
    division: "Rajshahi",
    upazilas: [
      "Bagha", "Bagmara", "Charghat", "Durgapur", "Godagari",
      "Mohanpur", "Paba", "Puthia", "Tanore",
    ],
    thanas: [
      "Boalia", "Rajpara", "Motihar", "Shah Makhdum", "Chandrima",
      "Kashiadanga", "Katakhali", "Belpukur", "Karnahar", "Damkura", "Airport",
    ],
    areas: ["Shaheb Bazar", "Zero Point", "Motihar RU", "Alupotti", "Shiroil", "Laxmipur Rajshahi", "Paba"],
  },

  Bogura: {
    division: "Rajshahi",
    upazilas: [
      "Bogura Sadar", "Adamdighi", "Dhunat", "Dupchanchia", "Gabtali",
      "Kahaloo", "Nandigram", "Sariakandi", "Shajahanpur", "Sherpur",
      "Shibganj", "Sonatala",
    ],
    thanas: [],
    areas: ["Shatmatha", "Jaleshwaritola", "Thonthonia", "Sherpur Bogura", "Santahar", "Mahasthangarh"],
  },

  Pabna: {
    division: "Rajshahi",
    upazilas: [
      "Pabna Sadar", "Atgharia", "Bera", "Bhangura", "Chatmohar",
      "Faridpur", "Ishwardi", "Santhia", "Sujanagar",
    ],
    thanas: ["Ataikula", "Aminpur"],
    areas: ["Pabna Town", "Ishwardi Junction", "Rooppur", "Bera Bazar", "Chatmohar"],
  },

  Sirajganj: {
    division: "Rajshahi",
    upazilas: [
      "Sirajganj Sadar", "Belkuchi", "Chauhali", "Kamarkhanda",
      "Kazipur", "Raiganj", "Shahjadpur", "Tarash", "Ullahpara",
    ],
    thanas: ["Enayetpur", "Salanga", "Bangabandhu Bridge West"],
    areas: ["Sirajganj Bazar", "Shahjadpur Town", "Belkuchi Handloom", "Ullahpara Junction", "Baghabari Port"],
  },

  Natore: {
    division: "Rajshahi",
    upazilas: [
      "Natore Sadar", "Bagatipara", "Baraigram", "Gurudaspur",
      "Lalpur", "Naldanga", "Singra",
    ],
    thanas: [],
    areas: ["Natore Town", "Kanaikhali", "Bonpara", "Singra Chalan Beel", "Ishwardi Bypass"],
  },

  Naogaon: {
    division: "Rajshahi",
    upazilas: [
      "Naogaon Sadar", "Atrai", "Badalgachhi", "Dhamoirhat", "Manda",
      "Mahadebpur", "Niamatpur", "Patnitala", "Porsha", "Raninagar", "Sapahar",
    ],
    thanas: [],
    areas: ["Naogaon Town", "Baludanga", "Somapura Mahavihara Paharpur", "Sapahar Mango Market", "Mahadebpur"],
  },

  Chapainawabganj: {
    division: "Rajshahi",
    upazilas: [
      "Chapainawabganj Sadar", "Bholahat", "Gomastapur", "Nachole", "Shibganj",
    ],
    thanas: [],
    areas: ["Shantir Mor", "Puratan Bazar", "Rohanpur", "Kansat", "Sona Masjid Land Port"],
  },

  Joypurhat: {
    division: "Rajshahi",
    upazilas: ["Joypurhat Sadar", "Akkelpur", "Kalai", "Khetlal", "Panchbibi"],
    thanas: [],
    areas: ["Joypurhat Zero Point", "Panchbibi", "Akkelpur", "Hili Border Area"],
  },

  // ========================================================================
  // 4. KHULNA DIVISION (10 Districts)
  // ========================================================================
  Khulna: {
    division: "Khulna",
    upazilas: [
      "Batiaghata", "Dacope", "Dumuria", "Dighalia", "Koyra",
      "Paikgachha", "Phultala", "Rupsha", "Terokhada",
    ],
    thanas: [
      "Khulna Sadar", "Sonadanga", "Khalishpur", "Daulatpur",
      "Khan Jahan Ali", "Aranghata", "Harintana", "Labanchara",
    ],
    areas: ["Dakbangla", "Shibbari Mor", "Sonadanga Bus Terminal", "Khalishpur", "Daulatpur", "Boyra", "Rupsha Ghat"],
  },

  Jashore: {
    division: "Khulna",
    upazilas: [
      "Jashore Sadar", "Abhaynagar", "Bagherpara", "Chaugachha",
      "Jhikargachha", "Keshabpur", "Manirampur", "Sharsha",
    ],
    thanas: ["Benapole Port"],
    areas: ["Doratana", "Chowrasta Jashore", "Benapole Land Port", "Noapara Industrial", "Keshabpur"],
  },

  Satkhira: {
    division: "Khulna",
    upazilas: [
      "Satkhira Sadar", "Assasuni", "Debhata", "Kalaroa",
      "Kaliganj", "Shyamnagar", "Tala",
    ],
    thanas: ["Patkelghata"],
    areas: ["Satkhira Town", "Shyamnagar Sundarban Point", "Bhomra Land Port", "Kalaroa", "Tala Bazar"],
  },

  Bagerhat: {
    division: "Khulna",
    upazilas: [
      "Bagerhat Sadar", "Chitalmari", "Fakirhat", "Kachua",
      "Mollahat", "Mongla", "Morrelganj", "Rampal", "Sarankhola",
    ],
    thanas: [],
    areas: ["Bagerhat Sadar", "Shat Gombuj Area", "Mongla Port", "Rampal", "Sarankhola Sundarban"],
  },

  Kushtia: {
    division: "Khulna",
    upazilas: [
      "Kushtia Sadar", "Bheramara", "Daulatpur", "Khoksa", "Kumarkhali", "Mirpur",
    ],
    thanas: ["Islamic University"],
    areas: ["Majampur Gate", "NS Road", "Lalon Shah Mazar", "Kumarkhali Weaving", "Bheramara"],
  },

  Jhenaidah: {
    division: "Khulna",
    upazilas: [
      "Jhenaidah Sadar", "Harinakunda", "Kaliganj",
      "Kotchandpur", "Maheshpur", "Shailkupa",
    ],
    thanas: [],
    areas: ["Payra Chattar", "Kaliganj Bazar", "Shailkupa", "Kotchandpur"],
  },

  Chuadanga: {
    division: "Khulna",
    upazilas: ["Chuadanga Sadar", "Alamdanga", "Damurhuda", "Jibannagar"],
    thanas: ["Darshana"],
    areas: ["Chuadanga Town", "Darshana Land Port", "Alamdanga Bazar", "Jibannagar"],
  },

  Magura: {
    division: "Khulna",
    upazilas: ["Magura Sadar", "Mohammadpur", "Shalikha", "Sreepur"],
    thanas: [],
    areas: ["Dhaka Road Magura", "Vaina Mor", "Mohammadpur Bazar", "Sreepur Magura"],
  },

  Narail: {
    division: "Khulna",
    upazilas: ["Narail Sadar", "Kalia", "Lohagara"],
    thanas: ["Naragati"],
    areas: ["Narail Town", "Lohagara Bazar", "Kalia", "Kalabaria"],
  },

  Meherpur: {
    division: "Khulna",
    upazilas: ["Meherpur Sadar", "Gangni", "Mujibnagar"],
    thanas: [],
    areas: ["Meherpur Town", "Mujibnagar Smriti Soudho", "Gangni Bazar"],
  },

  // ========================================================================
  // 5. BARISHAL DIVISION (6 Districts)
  // ========================================================================
  Barishal: {
    division: "Barishal",
    upazilas: [
      "Barishal Sadar", "Agailjhara", "Babuganj", "Bakerganj", "Banaripara",
      "Gaurnadi", "Hizla", "Mehendiganj", "Muladi", "Wazirpur",
    ],
    thanas: ["Kotwali", "Kawnia", "Airport", "Bandar", "Kazirhat"],
    areas: ["Sadargat Barishal", "Nathullabad", "Rupatoli", "C&B Road", "Chawkbazar Barishal", "Gaurnadi Bazar"],
  },

  Patuakhali: {
    division: "Barishal",
    upazilas: [
      "Patuakhali Sadar", "Bauphal", "Dashmina", "Dumki",
      "Galachipa", "Kalapara", "Mirzaganj", "Rangabali",
    ],
    thanas: ["Mohipur"],
    areas: ["Patuakhali Launch Ghat", "Kuakata Sea Beach", "Payra Port", "Kalapara", "Bauphal"],
  },

  Bhola: {
    division: "Barishal",
    upazilas: [
      "Bhola Sadar", "Borhanuddin", "Char Fasson", "Daulatkhan",
      "Lalmohan", "Manpura", "Tazumuddin",
    ],
    thanas: ["Shashibhushan", "Dularhat", "Dakshin Aicha"],
    areas: ["Bhola Sadar", "Char Fasson Town", "Jacob Tower Area", "Lalmohan", "Monpura Island"],
  },

  Pirojpur: {
    division: "Barishal",
    upazilas: [
      "Pirojpur Sadar", "Bhandaria", "Indurkani (Zianagar)",
      "Kawkhali", "Mathbaria", "Nazirpur", "Nesarabad (Swarupkathi)",
    ],
    thanas: [],
    areas: ["Pirojpur Town", "Swarupkathi Floating Timber Market", "Bhandaria", "Mathbaria"],
  },

  Barguna: {
    division: "Barishal",
    upazilas: ["Barguna Sadar", "Amtali", "Bamna", "Betagi", "Patharghata", "Taltali"],
    thanas: [],
    areas: ["Barguna Town", "Patharghata Fish Port", "Amtali", "Taltali Shuvoshondha Beach"],
  },

  Jhalokati: {
    division: "Barishal",
    upazilas: ["Jhalokati Sadar", "Kathalia", "Nalchity", "Rajapur"],
    thanas: [],
    areas: ["Jhalokati Town", "Bhimruli Floating Guava Market", "Nalchity", "Rajapur"],
  },

  // ========================================================================
  // 6. SYLHET DIVISION (4 Districts)
  // ========================================================================
  Sylhet: {
    division: "Sylhet",
    upazilas: [
      "Sylhet Sadar", "Balaganj", "Beanibazar", "Bishwanath", "Companiganj",
      "Dakshin Surma", "Fenchuganj", "Golapganj", "Gowainghat", "Jaintiapur",
      "Kanaighat", "Osmani Nagar", "Zakiganj",
    ],
    thanas: ["Kotwali", "Jalalabad", "Airport", "Shah Poran", "Dakshin Surma", "Moglabazar"],
    areas: [
      "Zindabazar", "Chowhatta", "Ambarkhana", "Shahi Eidgah", "Shahjalal Uposhohor",
      "Kumarpara", "Subidbazar", "Jaflong", "Bholaganj Sada Pathor", "Ratargul",
      "Beanibazar Town", "Golapganj",
    ],
  },

  Sunamganj: {
    division: "Sylhet",
    upazilas: [
      "Sunamganj Sadar", "Bishwamvarpur", "Chhatak", "Derai", "Dharamapasha",
      "Dowarabazar", "Jagannathpur", "Jamalganj", "Madhyanagar", "Shalla",
      "Shantiganj (Dakshin Sunamganj)", "Tahirpur",
    ],
    thanas: [],
    areas: ["Sunamganj Town", "Tanguar Haor", "Shimul Bagan", "Chhatak Cement Town", "Jagannathpur"],
  },

  Moulvibazar: {
    division: "Sylhet",
    upazilas: [
      "Moulvibazar Sadar", "Barlekha", "Juri", "Kamalganj",
      "Kulaura", "Rajnagar", "Sreemangal",
    ],
    thanas: [],
    areas: ["Moulvibazar Town", "Sreemangal Tea Gardens", "Madhabkund Waterfall", "Lawachara", "Kulaura"],
  },

  Habiganj: {
    division: "Sylhet",
    upazilas: [
      "Habiganj Sadar", "Ajmiriganj", "Bahubal", "Baniachong",
      "Chunarughat", "Lakhai", "Madhabpur", "Nabiganj", "Shayestaganj",
    ],
    thanas: [],
    areas: ["Habiganj Town", "Shayestaganj Junction", "Madhabpur Industrial", "Baniachong Village", "Satchhari"],
  },

  // ========================================================================
  // 7. RANGPUR DIVISION (8 Districts)
  // ========================================================================
  Rangpur: {
    division: "Rangpur",
    upazilas: [
      "Rangpur Sadar", "Badarganj", "Gangachhara", "Kaunia",
      "Mithapukur", "Pirgachha", "Pirganj", "Taraganj",
    ],
    thanas: ["Kotwali", "Parshuram", "Tajhat", "Mahiganj", "Haragach", "Hajirhat"],
    areas: ["Jahaj Company Mor", "Dhap", "Carmichael College Area", "Tajhat Palace", "Medical Mor Rangpur", "Pirganj"],
  },

  Dinajpur: {
    division: "Rangpur",
    upazilas: [
      "Dinajpur Sadar", "Birampur", "Birganj", "Biral", "Bochaganj",
      "Chirirbandar", "Phulbari", "Ghoraghat", "Hakimpur", "Kaharole",
      "Khansama", "Nawabganj", "Parbatipur",
    ],
    thanas: [],
    areas: ["Dinajpur Town", "Kantajew Temple Area", "Parbatipur Railway Junction", "Hili Land Port", "Barapukuria"],
  },

  Kurigram: {
    division: "Rangpur",
    upazilas: [
      "Kurigram Sadar", "Bhurungamari", "Char Rajibpur", "Chilmari",
      "Phulbari", "Nageshwari", "Rajarhat", "Raomari", "Ulipur",
    ],
    thanas: ["Kachakata", "Dushmara"],
    areas: ["Kurigram Town", "Chilmari Port", "Sonahat Land Port", "Nageshwari", "Rajarhat"],
  },

  Gaibandha: {
    division: "Rangpur",
    upazilas: [
      "Gaibandha Sadar", "Phulchhari", "Gobindaganj", "Palashbari",
      "Sadullapur", "Saghata", "Sundarganj",
    ],
    thanas: [],
    areas: ["Gaibandha Town", "Gobindaganj Bazar", "Palashbari Highway Point", "Sundarganj"],
  },

  Nilphamari: {
    division: "Rangpur",
    upazilas: [
      "Nilphamari Sadar", "Dimla", "Domar", "Jaldhaka", "Kishoreganj", "Saidpur",
    ],
    thanas: [],
    areas: ["Saidpur Airport Area", "Saidpur Railway Colony", "Nilphamari Town", "Uttara EPZ", "Domar"],
  },

  Lalmonirhat: {
    division: "Rangpur",
    upazilas: [
      "Lalmonirhat Sadar", "Aditmari", "Hatibandha", "Kaliganj", "Patgram",
    ],
    thanas: [],
    areas: ["Lalmonirhat Mission Mor", "Burimari Land Port", "Patgram", "Teesta Barrage Area"],
  },

  Panchagarh: {
    division: "Rangpur",
    upazilas: ["Panchagarh Sadar", "Atwari", "Boda", "Debiganj", "Tetulia"],
    thanas: [],
    areas: ["Panchagarh Town", "Tetulia Zero Point", "Banglabandha Land Port", "Boda Bazar"],
  },

  Thakurgaon: {
    division: "Rangpur",
    upazilas: [
      "Thakurgaon Sadar", "Baliadangi", "Haripur", "Pirganj", "Ranisankail",
    ],
    thanas: ["Ruhia", "Bhulli"],
    areas: ["Thakurgaon Chowrasta", "Ranisankail", "Pirganj", "Baliadangi"],
  },

  // ========================================================================
  // 8. MYMENSINGH DIVISION (4 Districts)
  // ========================================================================
  Mymensingh: {
    division: "Mymensingh",
    upazilas: [
      "Mymensingh Sadar (Kotwali)", "Bhaluka", "Dhobaura", "Fulbaria", "Gafargaon",
      "Gauripur", "Haluaghat", "Ishwarganj", "Muktagachha", "Nandail",
      "Phulpur", "Tarakanda", "Trishal",
    ],
    thanas: ["Pagla"],
    areas: [
      "Ganginar Par", "Chorpara", "Town Hall Mymensingh", "BAU Campus",
      "Bhaluka Industrial Zone", "Trishal JKKNIU", "Muktagachha Monda Area",
    ],
  },

  Jamalpur: {
    division: "Mymensingh",
    upazilas: [
      "Jamalpur Sadar", "Bakshiganj", "Dewanganj", "Islampur",
      "Madarganj", "Melandaha", "Sarishabari",
    ],
    thanas: [],
    areas: ["Jamalpur Town", "Sarishabari Jute Mills", "Islampur", "Bakshiganj Border Point"],
  },

  Netrokona: {
    division: "Mymensingh",
    upazilas: [
      "Netrokona Sadar", "Atpara", "Barhatta", "Durgapur", "Kalmakanda",
      "Kendua", "Khaliajuri", "Madan", "Mohanganj", "Purbadhala",
    ],
    thanas: [],
    areas: ["Netrokona Town", "Birishiri Durgapur", "Bijoypur White Clay", "Mohanganj Haor Point"],
  },

  Sherpur: {
    division: "Mymensingh",
    upazilas: ["Sherpur Sadar", "Jhenaigati", "Nakla", "Nalitabari", "Sreebardi"],
    thanas: [],
    areas: ["Sherpur Town", "Gojni Abokash", "Madhutila Ecopark", "Nalitabari", "Nakla"],
  },
};

// All 64 Districts sorted
export const BANGLADESH_DISTRICTS = Object.keys(BANGLADESH_ADMINISTRATIVE_DATA).sort((a, b) =>
  a.localeCompare(b)
);

// Map of District -> SubDistricts (all upazilas + thanas combined, deduplicated, sorted)
export const BANGLADESH_SUB_DISTRICTS_MAP = {};
// Map of SubDistrict (lowercase) -> Array of District names (handles same name across districts like Kotwali, Sadar, Kaliganj)
export const SUB_DISTRICT_TO_DISTRICTS = {};
// Map of District (lowercase) -> District official name
export const DISTRICT_LOWERCASE_MAP = {};

for (const [district, info] of Object.entries(BANGLADESH_ADMINISTRATIVE_DATA)) {
  DISTRICT_LOWERCASE_MAP[district.toLowerCase()] = district;

  const combined = Array.from(new Set([...info.upazilas, ...info.thanas])).sort((a, b) =>
    a.localeCompare(b)
  );
  BANGLADESH_SUB_DISTRICTS_MAP[district] = combined;

  for (const sub of combined) {
    const key = sub.toLowerCase();
    if (!SUB_DISTRICT_TO_DISTRICTS[key]) {
      SUB_DISTRICT_TO_DISTRICTS[key] = [];
    }
    SUB_DISTRICT_TO_DISTRICTS[key].push(district);
  }
}

/**
 * Get all 8 divisions
 */
export function getAllDivisions() {
  return BANGLADESH_DIVISIONS;
}

/**
 * Get all 64 districts (sorted)
 */
export function getAllDistricts() {
  return BANGLADESH_DISTRICTS;
}

/**
 * Get districts in a specific division
 */
export function getDistrictsByDivision(divisionName) {
  if (!divisionName) return BANGLADESH_DISTRICTS;
  const divLower = divisionName.toLowerCase();
  return Object.entries(BANGLADESH_ADMINISTRATIVE_DATA)
    .filter(([_, data]) => data.division.toLowerCase() === divLower)
    .map(([district]) => district)
    .sort((a, b) => a.localeCompare(b));
}

/**
 * Get all sub-districts (upazilas + thanas) for a district
 */
export function getSubDistrictsByDistrict(districtName) {
  if (!districtName) return [];
  const official = DISTRICT_LOWERCASE_MAP[districtName.trim().toLowerCase()];
  if (!official) return [];
  return BANGLADESH_SUB_DISTRICTS_MAP[official] || [];
}

export const DHAKA_THANA_AREAS_MAP = {
  tejgaon: ["Farmgate", "Kawran Bazar", "Karwan Bazar", "Tejgaon", "Nakhalpara", "Bijoy Sarani", "Khamarbari"],
  "tejgaon industrial area": ["Tejgaon Industrial Area", "Nabiket", "Kunipara"],
  shahbagh: ["Shahbagh", "Shahbag", "Katabon", "Paribagh", "Banglamotor", "Elephant Road", "Science Lab", "Nilkhet"],
  "sher-e-bangla nagar": ["Agargaon", "Agargaon Taltola", "West Agargaon", "Shyamoli", "Manik Mia Avenue", "Bijoy Sarani"],
  kafrul: ["Kazipara", "Shewrapara", "South Kazipara", "Senpara Parbata", "Mirpur 14", "Kafrul"],
  mirpur: ["Mirpur 1", "Mirpur 2", "Mirpur 6", "Mirpur 10", "Mirpur 11", "Mirpur 12", "Mirpur 14", "Kazipara", "Shewrapara", "Kalyanpur"],
  cantonment: ["ECB Chattar", "ECB Square", "Matikata", "Dhaka Cantonment", "Zia Colony"],
  pallabi: ["Kalshi", "Kalshi Mor", "Pallabi", "Mirpur 11", "Mirpur 12", "Purobi"],
  bhashantek: ["Bhashantek", "Kalshi", "ECB Chattar", "Damalkot"],
  "darus salam": ["Kalyanpur", "Kallyanpur", "Darus Salam", "Technical", "Gabtoli"],
  ramna: ["Kakrail", "Shantinagar", "Malibagh", "Moghbazar", "Eskaton", "Baily Road"],
  kalabagan: ["Panthapath", "Green Road", "Kalabagan", "Dhanmondi 32", "Sobhanbag", "Kathalbagan"],
  dhanmondi: ["Dhanmondi 27", "Dhanmondi 32", "Jigatola", "Rayer Bazar", "Sobhanbag"],
  mohammadpur: ["Town Hall", "Lalmatia", "Salimullah Road", "Iqbal Road", "Taj Mahal Road", "Japan Garden City", "Shekhertek"],
  gulshan: ["Gulshan 1", "Gulshan 2", "Niketan", "Police Plaza"],
  banani: ["Banani", "Banani DOHS", "Kakoli", "Kemal Ataturk Avenue"],
  khilkhet: ["Khilkhet", "Kuril", "Nikunja 1", "Nikunja 2", "Pink City"],
  bhatara: ["Nodda", "Nadda", "Notun Bazar", "Natun Bazar", "Bashundhara R/A", "Bhatara", "Nayanagar", "Kuril", "Solmaid"],
  badda: ["Notun Bazar", "Natun Bazar", "Badda", "Middle Badda", "North Badda", "South Badda", "Merul Badda", "Aftabnagar"],
  rampura: ["Rampura", "Banasree", "Mahanagar Project"],
};

/**
 * Get suggested popular areas/elaka for a district or sub-district
 */
export function getSuggestedAreas(districtName, subDistrictName = "") {
  if (!districtName) return [];
  const official = DISTRICT_LOWERCASE_MAP[districtName.trim().toLowerCase()];
  if (!official) return [];
  const info = BANGLADESH_ADMINISTRATIVE_DATA[official];
  if (!info) return [];

  if (subDistrictName) {
    const subLower = subDistrictName.trim().toLowerCase();
    if (official === "Dhaka" && DHAKA_THANA_AREAS_MAP[subLower]) {
      return DHAKA_THANA_AREAS_MAP[subLower];
    }
    const filtered = (info.areas || []).filter((a) => a.toLowerCase().includes(subLower));
    if (filtered.length > 0) return filtered;
  }
  return info.areas || [];
}

/**
 * Check if a district name is valid in Bangladesh
 */
export function isValidDistrictName(districtName) {
  if (typeof districtName !== "string") return false;
  return Boolean(DISTRICT_LOWERCASE_MAP[districtName.trim().toLowerCase()]);
}

/**
 * Check if subDistrict belongs to district
 */
export function isValidSubDistrictName(districtName, subDistrictName) {
  if (typeof districtName !== "string" || typeof subDistrictName !== "string") return false;
  const official = DISTRICT_LOWERCASE_MAP[districtName.trim().toLowerCase()];
  if (!official) return false;

  const validSubs = BANGLADESH_SUB_DISTRICTS_MAP[official] || [];
  const subLower = subDistrictName.trim().toLowerCase();

  return validSubs.some((s) => s.toLowerCase() === subLower);
}

