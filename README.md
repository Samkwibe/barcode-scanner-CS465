# Barcode Scanner Web App - CS465 Project

## Project Overview

A modern, full-featured **Progressive Web Application (PWA)** for scanning barcodes and managing product inventory with intelligent expiration tracking. This project addresses the significant issue of food waste in the U.S., where the average American discards approximately $2000 worth of edible food annually, contributing to an estimated $408 billion in grocery waste nationwide.

### The Solution

Our app helps users manage their food inventory by:
- **Scanning products** with their phone camera or by uploading images
- **Tracking expiration dates** with visual countdowns and notifications
- **Managing scan history** with search and filter capabilities
- **Viewing detailed product information** including images, brands, and descriptions
- **Syncing across devices** with cloud storage and offline support

## ✨ Key Features

### 🔍 Barcode Scanning
- **Real-time camera scanning** with live preview
- **Image upload** with drag-and-drop support
- **Multiple barcode formats**: UPC, EAN, QR codes, Code 39, Code 128, and more
- **Torch/flash control** for low-light environments
- **Camera selection** for multi-camera devices
- **Zoom controls** for precise scanning

### 👤 User Authentication
- **Anonymous sign-in**: Start immediately without an account
- **Email/Password authentication**: Create persistent accounts
- **Cloud sync**: Automatic sync across devices
- **Offline mode**: Continue working without internet

### 📦 Product Information
- **Automatic product lookup** via API integration
- **Product details**: Name, brand, description, images
- **Scan confirmation dialog**: Review before saving
- **Custom notes**: Add personal notes to items

### 📅 Expiration Tracking
- **Custom expiration dates** for each item
- **Smart defaults**: 30-day expiration if not specified
- **Visual status indicators**:
  - ✅ Fresh (>7 days)
  - ⚠️ Expiring Soon (≤7 days)
  - ❌ Expired
- **Real-time countdown** with live updates
- **Browser notifications** for expiring items

### 📜 Scan History
- **Beautiful card-based UI** with modern design
- **Search functionality**: Find items by name, brand, or barcode
- **Smart filters**: View all, fresh, expiring, or expired items
- **Click to view details**: Full product information modal
- **Delete or clear** individual or all items

### 🎨 Modern UI/UX
- **Responsive design**: Works on phones, tablets, and desktops
- **Dark mode support**: Automatic theme based on system preference
- **Smooth animations**: Fade-ins, transitions, hover effects
- **Accessible**: Keyboard navigation and screen reader support

### 🌐 Progressive Web App
- **Installable**: Add to home screen like a native app
- **Offline capable**: Works without internet connection
- **Fast loading**: Optimized performance
- **App-like experience**: Runs in standalone window

## 🚀 Quick Start

### For Users

1. **Open the app** in a modern web browser (Chrome, Safari, Edge, or Firefox)
2. **Allow camera access** when prompted
3. **Sign in** (or choose "Continue Without Account")
4. **Start scanning** barcodes!
5. **Optional**: Add to home screen for native app experience

### For Developers

#### Prerequisites
- Node.js (v14 or higher)
- npm or yarn
- Modern web browser
- Firebase account (for cloud features)

#### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/barcode-scanner-CS465.git
cd barcode-scanner-CS465

# Install dependencies
npm install
```

#### Configuration

1. **Firebase Setup** (Optional - for cloud features)
   - Create a Firebase project at [firebase.google.com](https://firebase.google.com)
   - Enable Firestore Database and Authentication
   - Copy your Firebase config to `src/js/services/firebase-config.js`
   - See `FIREBASE_README_SETUP.md` for detailed instructions

2. **API Keys** (Optional - for product lookup)
   - Get a free API key from [UPC Database](https://upcdatabase.org/)
   - Add to `src/js/constants.js`

#### Running Locally

```bash
# Start the development server
npm start

# The app will open at http://localhost:8080 (or similar)
```

#### Building for Production

```bash
# Build optimized production files
npm run build

# Deploy to your hosting service
# (Netlify, Vercel, Firebase Hosting, GitHub Pages, etc.)
```

## 📱 Technology Stack

### Frontend
- **Vanilla JavaScript (ES6+)**: Modern JavaScript without frameworks
- **Web Components**: Reusable custom elements
- **CSS Variables**: Dynamic theming and styling
- **HTML5**: Semantic markup

### APIs & Services
- **Barcode Detection API**: Native browser barcode scanning
- **Firebase Firestore**: Cloud database for sync
- **Firebase Authentication**: User accounts and security
- **UPC Database API**: Product information lookup

### PWA Features
- **Service Workers**: Offline functionality
- **Web App Manifest**: Installation support
- **IndexedDB**: Local data storage
- **Background Sync**: Automatic cloud sync

## 📖 Documentation

- **[FEATURES.md](./FEATURES.md)**: Complete feature documentation
- **[QUICK_START.md](./QUICK_START.md)**: Quick setup guide
- **[FIREBASE_README_SETUP.md](./FIREBASE_README_SETUP.md)**: Firebase configuration
- **[DESIGN.md](./DESIGN.md)**: Design decisions and architecture
- **[PROGRESS.md](./PROGRESS.md)**: Development progress log
- **[TESTING.md](./TESTING.md)**: Testing documentation

## 👥 Team Members

**Samuel Kwibe**: Backend development, API integration, database management

**Jon Scott**: Backend development, UPC API integration, Spoonacular API

**Jonathan Corwin**: UI/UX design, testing, presentation

**Isaac Akhtar Zada**: Frontend development, expiration timer, mobile optimization

**Elena Guzman**: Frontend design, landing page, navigation

## 🎯 Project Goals Achieved

✅ **Barcode scanning** with camera and image upload  
✅ **User authentication** with Firebase  
✅ **Product information lookup** via API  
✅ **Expiration date tracking** with countdowns  
✅ **Scan history** with search and filters  
✅ **Cloud sync** across devices  
✅ **Offline support** with local storage  
✅ **Responsive design** for all devices  
✅ **PWA installation** for native app feel  
✅ **Modern UI/UX** with animations and accessibility

## 🚧 Future Enhancements

- 📊 Statistics dashboard with insights
- 🛒 Shopping list integration
- 📱 Share and export history
- 🔔 Custom notification settings
- 🌍 Multi-language support
- 📸 Receipt scanning
- 🤖 AI-powered expiration predictions
- 📦 Batch scanning mode

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

## 🙏 Acknowledgments

- **UPC Database** for product information API
- **Firebase** for backend infrastructure
- **The Barcode Detection API** for browser-based scanning
- **CS465 Course** at [University Name] for project guidance
- All team members for their dedication and hard work

## 📞 Support

For issues, questions, or suggestions:
- **GitHub Issues**: Report bugs or request features
- **Email**: [your-email@example.com]
- **Documentation**: See docs folder for detailed guides

---

**Built with ❤️ by the CS465 Team**  
**Last Updated**: December 2025
