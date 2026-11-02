export const PROVINCES = [
  'Punjab',
  'Sindh',
  'Khyber Pakhtunkhwa',
  'Balochistan',
  'Islamabad Capital Territory',
  'Gilgit-Baltistan',
  'Azad Jammu & Kashmir',
];

export const CITIES = {
  Punjab: [
    'Lahore', 'Faisalabad', 'Rawalpindi', 'Multan', 'Gujranwala', 'Sialkot', 'Bahawalpur', 'Sargodha',
    'Sheikhupura', 'Rahim Yar Khan', 'Jhang', 'Dera Ghazi Khan', 'Gujrat', 'Sahiwal', 'Wah Cantt', 'Kasur',
    'Okara', 'Chiniot', 'Kamoke', 'Hafizabad', 'Sadiqabad', 'Burewala', 'Khanewal', 'Muzaffargarh',
    'Mandi Bahauddin', 'Jhelum', 'Chakwal', 'Attock', 'Vehari', 'Pakpattan', 'Bahawalnagar', 'Mianwali',
    'Narowal', 'Khushab', 'Layyah', 'Lodhran', 'Toba Tek Singh', 'Nankana Sahib', 'Bhakkar', 'Rajanpur',
  ],
  Sindh: [
    'Karachi', 'Hyderabad', 'Sukkur', 'Larkana', 'Nawabshah', 'Mirpur Khas', 'Jacobabad', 'Shikarpur',
    'Khairpur', 'Dadu', 'Thatta', 'Badin', 'Tando Allahyar', 'Tando Adam', 'Umerkot', 'Ghotki', 'Sanghar',
  ],
  'Khyber Pakhtunkhwa': [
    'Peshawar', 'Mardan', 'Abbottabad', 'Mingora', 'Kohat', 'Dera Ismail Khan', 'Mansehra', 'Swabi',
    'Nowshera', 'Charsadda', 'Bannu', 'Haripur', 'Chitral', 'Batkhela', 'Timergara', 'Karak', 'Lakki Marwat',
  ],
  Balochistan: ['Quetta', 'Turbat', 'Khuzdar', 'Hub', 'Chaman', 'Gwadar', 'Sibi', 'Zhob', 'Loralai', 'Dera Murad Jamali'],
  'Islamabad Capital Territory': ['Islamabad'],
  'Gilgit-Baltistan': ['Gilgit', 'Skardu', 'Hunza', 'Ghizer', 'Chilas'],
  'Azad Jammu & Kashmir': ['Muzaffarabad', 'Mirpur', 'Kotli', 'Bhimber', 'Rawalakot', 'Bagh'],
};

export const ALL_CITIES = Object.values(CITIES).flat().sort();

// Accepts 03XXXXXXXXX, +923XXXXXXXXX, 00923XXXXXXXXX, 923XXXXXXXXX (spaces/dashes allowed).
export function normalizePkPhone(input) {
  const digits = String(input || '').replace(/[\s\-()]/g, '');
  const m = digits.match(/^(?:\+92|0092|92|0)(3\d{9})$/);
  return m ? `0${m[1]}` : null;
}

export function isValidPkPhone(input) {
  return normalizePkPhone(input) !== null;
}

export function whatsappLink(number, text) {
  const n = normalizePkPhone(number);
  const intl = n ? `92${n.slice(1)}` : String(number || '').replace(/\D/g, '');
  return `https://wa.me/${intl}${text ? `?text=${encodeURIComponent(text)}` : ''}`;
}
