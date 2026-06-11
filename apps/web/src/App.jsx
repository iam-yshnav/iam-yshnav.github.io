import React from 'react';
import { Helmet } from 'react-helmet';
import TerminalSystem from './components/TerminalSystem.jsx';

function App() {
  return (
    <>
      <Helmet>
        <title>Vyshnav Vinod</title>
        <meta name="description" content="Interactive Linux terminal portfolio for Cybersecurity and VAPT analyst Vyshnav Vinod." />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover" />
        <meta name="theme-color" content="#000000" />
      </Helmet>
      
      <TerminalSystem />
    </>
  );
}

export default App;