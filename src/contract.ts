import { BrowserProvider, Contract } from "ethers";

export const contractAddress = "0x5F213F8dF734215746D283dc668d234B868a66Cc";
export const contractABI = [
  {
    inputs: [],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "issueId",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "string",
        name: "databaseId",
        type: "string",
      },
      {
        indexed: false,
        internalType: "string",
        name: "location",
        type: "string",
      },
      {
        indexed: false,
        internalType: "string",
        name: "description",
        type: "string",
      },
      {
        indexed: false,
        internalType: "string",
        name: "status",
        type: "string",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "timestamp",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "string",
        name: "imageUrl",
        type: "string",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "upvotes",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "string",
        name: "reporterEmail",
        type: "string",
      },
    ],
    name: "IssueLogged",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "issueId",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "string",
        name: "newStatus",
        type: "string",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "timestamp",
        type: "uint256",
      },
    ],
    name: "IssueStatusSynced",
    type: "event",
  },
  {
    inputs: [],
    name: "admin",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "string",
        name: "databaseId",
        type: "string",
      },
    ],
    name: "findIssueByDatabaseId",
    outputs: [
      {
        internalType: "bool",
        name: "found",
        type: "bool",
      },
      {
        internalType: "uint256",
        name: "id",
        type: "uint256",
      },
      {
        internalType: "string",
        name: "location",
        type: "string",
      },
      {
        internalType: "string",
        name: "description",
        type: "string",
      },
      {
        internalType: "string",
        name: "status",
        type: "string",
      },
      {
        internalType: "uint256",
        name: "timestamp",
        type: "uint256",
      },
      {
        internalType: "string",
        name: "imageUrl",
        type: "string",
      },
      {
        internalType: "uint256",
        name: "upvotes",
        type: "uint256",
      },
      {
        internalType: "string",
        name: "reporterEmail",
        type: "string",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "issueId",
        type: "uint256",
      },
    ],
    name: "getIssue",
    outputs: [
      {
        internalType: "uint256",
        name: "id",
        type: "uint256",
      },
      {
        internalType: "string",
        name: "databaseId",
        type: "string",
      },
      {
        internalType: "string",
        name: "location",
        type: "string",
      },
      {
        internalType: "string",
        name: "description",
        type: "string",
      },
      {
        internalType: "string",
        name: "status",
        type: "string",
      },
      {
        internalType: "uint256",
        name: "timestamp",
        type: "uint256",
      },
      {
        internalType: "string",
        name: "imageUrl",
        type: "string",
      },
      {
        internalType: "uint256",
        name: "upvotes",
        type: "uint256",
      },
      {
        internalType: "string",
        name: "reporterEmail",
        type: "string",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getIssueCount",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "startId",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "limit",
        type: "uint256",
      },
    ],
    name: "getIssues",
    outputs: [
      {
        components: [
          {
            internalType: "uint256",
            name: "id",
            type: "uint256",
          },
          {
            internalType: "string",
            name: "databaseId",
            type: "string",
          },
          {
            internalType: "string",
            name: "location",
            type: "string",
          },
          {
            internalType: "string",
            name: "description",
            type: "string",
          },
          {
            internalType: "string",
            name: "status",
            type: "string",
          },
          {
            internalType: "uint256",
            name: "timestamp",
            type: "uint256",
          },
          {
            internalType: "string",
            name: "imageUrl",
            type: "string",
          },
          {
            internalType: "uint256",
            name: "upvotes",
            type: "uint256",
          },
          {
            internalType: "string",
            name: "reporterEmail",
            type: "string",
          },
        ],
        internalType: "struct IssueLogger.Issue[]",
        name: "",
        type: "tuple[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "issueCount",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    name: "issues",
    outputs: [
      {
        internalType: "uint256",
        name: "id",
        type: "uint256",
      },
      {
        internalType: "string",
        name: "databaseId",
        type: "string",
      },
      {
        internalType: "string",
        name: "location",
        type: "string",
      },
      {
        internalType: "string",
        name: "description",
        type: "string",
      },
      {
        internalType: "string",
        name: "status",
        type: "string",
      },
      {
        internalType: "uint256",
        name: "timestamp",
        type: "uint256",
      },
      {
        internalType: "string",
        name: "imageUrl",
        type: "string",
      },
      {
        internalType: "uint256",
        name: "upvotes",
        type: "uint256",
      },
      {
        internalType: "string",
        name: "reporterEmail",
        type: "string",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "string",
        name: "databaseId",
        type: "string",
      },
      {
        internalType: "string",
        name: "location",
        type: "string",
      },
      {
        internalType: "string",
        name: "description",
        type: "string",
      },
      {
        internalType: "string",
        name: "status",
        type: "string",
      },
      {
        internalType: "string",
        name: "imageUrl",
        type: "string",
      },
      {
        internalType: "string",
        name: "reporterEmail",
        type: "string",
      },
    ],
    name: "logIssue",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "string",
        name: "databaseId",
        type: "string",
      },
      {
        internalType: "string",
        name: "location",
        type: "string",
      },
      {
        internalType: "string",
        name: "description",
        type: "string",
      },
      {
        internalType: "string",
        name: "status",
        type: "string",
      },
      {
        internalType: "uint256",
        name: "timestamp",
        type: "uint256",
      },
      {
        internalType: "string",
        name: "imageUrl",
        type: "string",
      },
      {
        internalType: "uint256",
        name: "upvotes",
        type: "uint256",
      },
      {
        internalType: "string",
        name: "reporterEmail",
        type: "string",
      },
    ],
    name: "syncFromDatabase",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "issueId",
        type: "uint256",
      },
      {
        internalType: "string",
        name: "newStatus",
        type: "string",
      },
    ],
    name: "syncIssueStatus",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
];

let provider: BrowserProvider | null = null;
let contract: Contract | null = null;

// Initialize the contract with a signer for transactions
export async function initializeContractWithSigner() {
  if (!window.ethereum) {
    throw new Error("Please install MetaMask to interact with the blockchain");
  }
  provider = new BrowserProvider(window.ethereum);
  contract = new Contract(
    contractAddress,
    contractABI,
    await provider.getSigner()
  );
  return contract;
}

// Initialize the contract for read-only operations (no signer needed)
export async function initializeContractReadOnly() {
  if (!window.ethereum) {
    throw new Error("Please install MetaMask to view blockchain data");
  }
  provider = new BrowserProvider(window.ethereum);
  contract = new Contract(contractAddress, contractABI, provider);
  return contract;
}

// Log issue to blockchain
export async function logIssue(
  databaseId: string,
  location: string,
  description: string,
  status: string,
  imageUrl: string = "",
  upvotes: number = 0,
  reporterEmail: string = ""
) {
  try {
    // Always initialize with signer for state-changing operations
    await initializeContractWithSigner();
    if (!contract) {
      throw new Error("Failed to initialize contract");
    }

    console.log("Logging issue with params:", {
      databaseId,
      location,
      description,
      status,
      imageUrl,
      upvotes,
      reporterEmail,
    });

    // Request account access if needed
    await window.ethereum?.request({ method: "eth_requestAccounts" });

    // Call the public logIssue function
    // Provide an explicit gasLimit to avoid extra estimateGas RPC calls
    // which can trigger provider rate-limiting / circuit-breaker in MetaMask
    const gasLimit = 500_000; // reasonable upper bound for this contract
    const tx = await contract.logIssue(
      databaseId,
      location,
      description,
      status,
      imageUrl || "", // Image URL is optional
      "", // reporterEmail is optional
      { gasLimit }
    );

    console.log("Transaction sent:", tx.hash);
    const receipt = await tx.wait();
    console.log("Transaction confirmed:", receipt);

    return true;
  } catch (error: any) {
    console.error("Error logging to blockchain:", error);

    // Friendly handling for MetaMask/provider circuit-breaker or RPC internal errors
    // Some provider errors include nested data; inspect common paths
    const message =
      error?.data?.message ||
      error?.data?.cause?.message ||
      error?.message ||
      "Unknown error";

    if (String(message).toLowerCase().includes("circuit breaker")) {
      throw new Error(
        "Blockchain provider temporarily blocked (circuit breaker). Try reconnecting your wallet or wait a few moments and retry."
      );
    }

    if (
      String(message).toLowerCase().includes("internal json-rpc error") ||
      String(message).toLowerCase().includes("internal error")
    ) {
      throw new Error(
        `Blockchain RPC error: ${message}. Try refreshing the page, reconnecting MetaMask, and ensuring you're on the correct network (Sepolia).`
      );
    }

    // Check if it's an admin permission error
    if (String(message).includes("Only admin can call this function")) {
      throw new Error(
        "Only the admin account can log issues to the blockchain. Please contact the administrator."
      );
    }

    // Default fallback
    throw new Error(`Blockchain error: ${message}`);
  }
}
