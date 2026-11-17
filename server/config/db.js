import { setServers } from "node:dns";
import mongoose from "mongoose";

export async function connectDatabase() {
  if (!process.env.MONGODB_URI) throw new Error("MONGODB_URI is required");
  if (process.env.MONGODB_DNS_SERVERS !== undefined) {
    const dnsServers = process.env.MONGODB_DNS_SERVERS.split(",").map((server) => server.trim()).filter(Boolean);
    if (dnsServers.length === 0) throw new Error("MONGODB_DNS_SERVERS must contain at least one DNS server");
    setServers(dnsServers);
  } else {
    setServers(["8.8.8.8", "1.1.1.1"]);
  }
  await mongoose.connect(process.env.MONGODB_URI);
  console.info(`MongoDB connected: ${mongoose.connection.name}`);
}
