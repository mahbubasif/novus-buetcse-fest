import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { MainLayout } from './components/layout';
import { Dashboard, Search, Chat, MaterialView, LabGenerator } from './pages';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="search" element={<Search />} />
          <Route path="chat" element={<Chat />} />
          <Route path="lab-generator" element={<LabGenerator />} />
          <Route path="materials/:id" element={<MaterialView />} />
          <Route path="settings" element={<ComingSoon title="Settings" />} />
          <Route path="help" element={<ComingSoon title="Help Center" />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

// Placeholder for future pages
function ComingSoon({ title }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">{title}</h1>
      <p className="text-gray-500">This page is under construction.</p>
    </div>
  );
}

export default App;
