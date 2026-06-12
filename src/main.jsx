import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
// import AdRunner from "ad-runner-component";
// import AdRunner from "./Components/Ads components/Ads snippets/Ad_auto_runing_component.jsx";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    {/* <AdRunner Code="cxHBsS45LPohN0688y296SF" skipTime='10' waiting='5000'> */}
      <App />
    {/* </AdRunner> */}
  </React.StrictMode>
);
