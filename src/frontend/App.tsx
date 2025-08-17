import { useCallback, useEffect, useState } from "react";
import "./App.css";

function App() {
  const [nodeVersion, setNodeVersion] = useState<string | undefined>(undefined);

  const updateNodeVersion = useCallback(
    async () =>
      setNodeVersion(await backend.nodeVersion("Hello from App.tsx!")),
    []
  );

  useEffect(() => {
    backend.onMain("ws-message", (msg) => {
      console.log("WebSocket message received:", msg);
    });

    backend.onMain("print-job", (msg) => {
      console.log("Print job message received:", msg);
    });
  }, []);

  return (
    <div className="App">
      <pre>
        {/* {data.map((item, index) => (
          <div key={index}>{JSON.stringify(item, null, 2)}</div>
        ))} */}
      </pre>
      {/* snip... */}
      <button onClick={updateNodeVersion}>Node version is {nodeVersion}</button>
      {/* snip... */}
    </div>
  );
}

export default App;
