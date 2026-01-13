import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import CreateRFP from './pages/CreateRFP';
import Vendors from './pages/Vendors';
import RFPDetail from './pages/RFPDetail';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-100">
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex">
                <div className="flex-shrink-0 flex items-center">
                  <span className="text-xl font-bold text-indigo-600">RFP System</span>
                </div>
                <div className="ml-6 flex items-center space-x-4">
                  <Link to="/" className="text-gray-900 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium">Create RFP</Link>
                  <Link to="/vendors" className="text-gray-900 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium">Vendors</Link>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <Routes>
            <Route path="/" element={<CreateRFP />} />
            <Route path="/vendors" element={<Vendors />} />
            <Route path="/rfps/:id" element={<RFPDetail />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
