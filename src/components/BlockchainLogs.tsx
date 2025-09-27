import React, { useState } from "react";
import { initializeContractWithSigner } from "../contract.ts";
import { Button } from "./ui/button";
import { Loader2 } from "lucide-react";

interface Log {
  issueId: number;
  databaseId: string;
  location: string;
  description: string;
  status: string;
  timestamp: number;
}

const BlockchainLogs = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [logs, setLogs] = useState<Log[]>([]);
  const [error, setError] = useState("");

  const connectWallet = async () => {
    try {
      setIsLoading(true);
      setError("");

      if (!window.ethereum) {
        throw new Error("Please install MetaMask to view blockchain logs");
      }

      // Request account access
      await window.ethereum.request({ method: "eth_requestAccounts" });
      setIsConnected(true);

      // Load logs after connecting
      await loadLogs();
    } catch (err: any) {
      console.error("Error connecting wallet:", err);
      setError(err.message || "Failed to connect wallet");
    } finally {
      setIsLoading(false);
    }
  };

  const loadLogs = async () => {
    try {
      setIsLoading(true);
      setError("");

      const contract = await initializeContractWithSigner();
      if (!contract) {
        throw new Error("Failed to initialize contract");
      }
      console.log("Contract initialized:", contract);

      // Get the total number of logs
      console.log("Contract methods:", Object.keys(contract));
      const totalLogs = await contract.issueCount();
      console.log("Total logs:", totalLogs);
      const logsArray: Log[] = [];

      // Fetch each log (using 1-based index since that's how the contract works)
      for (let i = 1; i <= totalLogs; i++) {
        console.log("Fetching log", i);
        const [
          databaseId,
          location,
          description,
          status,
          timestamp,
          imageUrl,
          upvotes,
          reporterEmail,
        ] = await contract.getIssue(i);

        logsArray.push({
          issueId: i,
          databaseId,
          location,
          description,
          status,
          timestamp: Number(timestamp),
        });
      }

      // Sort logs by timestamp, most recent first
      logsArray.sort((a, b) => b.timestamp - a.timestamp);
      setLogs(logsArray);
    } catch (err: any) {
      console.error("Error loading logs:", err);
      let errorMessage = "Failed to load blockchain logs";
      if (err.message.includes("execution reverted")) {
        errorMessage =
          "No logs found in the contract yet. Please submit a report first.";
      } else {
        errorMessage = `Error: ${err.message}`;
      }
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString();
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Blockchain Logs
        </h1>

        {!isConnected ? (
          <div className="text-center py-8">
            <Button
              onClick={connectWallet}
              disabled={isLoading}
              size="lg"
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Connecting...
                </>
              ) : (
                "Connect Wallet to View Logs"
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {isLoading && (
              <div className="text-center py-4">
                <Loader2 className="h-8 w-8 animate-spin mx-auto" />
                <p className="text-gray-600 mt-2">Loading logs...</p>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
                {error}
              </div>
            )}

            {!isLoading && !error && logs.length === 0 && (
              <div className="text-center py-8 text-gray-600">
                No logs found in the blockchain
              </div>
            )}

            {logs.map((log) => (
              <div
                key={log.issueId}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Issue ID</p>
                    <p className="font-medium">{log.issueId}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Database ID</p>
                    <p className="font-medium">{log.databaseId}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Location</p>
                    <p className="font-medium">{log.location}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Status</p>
                    <p className="font-medium capitalize">{log.status}</p>
                  </div>
                  <div className="md:col-span-2">
                    <p className="text-sm text-gray-500">Description</p>
                    <p className="font-medium">{log.description}</p>
                  </div>
                  <div className="md:col-span-2">
                    <p className="text-sm text-gray-500">Timestamp</p>
                    <p className="font-medium">{formatDate(log.timestamp)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default BlockchainLogs;
