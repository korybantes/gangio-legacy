import { getAuthSession } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";

async function getStats() {
  try {
    const db = await connectToDatabase();
    
    // Get counts from various collections
    const usersCount = await db.collection("users").countDocuments();
    const serversCount = await db.collection("servers").countDocuments();
    const messagesCount = await db.collection("messages").countDocuments();
    const channelsCount = await db.collection("channels").countDocuments();
    
    // Get recent users
    const recentUsers = await db.collection("users")
      .find({})
      .sort({ createdAt: -1 })
      .limit(5)
      .toArray();
      
    // Get recent servers
    const recentServers = await db.collection("servers")
      .find({})
      .sort({ createdAt: -1 })
      .limit(5)
      .toArray();
    
    return {
      counts: {
        users: usersCount,
        servers: serversCount,
        messages: messagesCount,
        channels: channelsCount
      },
      recentUsers,
      recentServers
    };
  } catch (error) {
    console.error("Error fetching admin stats:", error);
    return {
      counts: { users: 0, servers: 0, messages: 0, channels: 0 },
      recentUsers: [],
      recentServers: []
    };
  }
}

export default async function AdminPage() {
  const session = await getAuthSession();
  const stats = await getStats();
  
  return (
    <div className="h-full">
      <div className="flex flex-col">
        <div className="p-6">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-2xl font-bold">Admin Dashboard</h1>
            <div className="flex items-center gap-x-2">
              <div className="font-semibold text-sm">
                Welcome, {session?.user?.name || "Admin"}
              </div>
              <div className="h-8 w-8 rounded-full bg-indigo-500 flex items-center justify-center text-white">
                {session?.user?.name?.[0]?.toUpperCase() || "A"}
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-white dark:bg-zinc-800 rounded-lg shadow p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">Total Users</p>
                  <h3 className="text-2xl font-bold">{stats.counts.users}</h3>
                </div>
                <div className="h-12 w-12 bg-indigo-100 dark:bg-indigo-900 rounded-full flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-500">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                    <circle cx="9" cy="7" r="4"></circle>
                    <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                  </svg>
                </div>
              </div>
            </div>
            
            <div className="bg-white dark:bg-zinc-800 rounded-lg shadow p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">Total Servers</p>
                  <h3 className="text-2xl font-bold">{stats.counts.servers}</h3>
                </div>
                <div className="h-12 w-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500">
                    <rect width="20" height="16" x="2" y="4" rx="2"></rect>
                    <path d="M6 8h.01"></path>
                    <path d="M10 8h.01"></path>
                  </svg>
                </div>
              </div>
            </div>
            
            <div className="bg-white dark:bg-zinc-800 rounded-lg shadow p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">Total Messages</p>
                  <h3 className="text-2xl font-bold">{stats.counts.messages}</h3>
                </div>
                <div className="h-12 w-12 bg-yellow-100 dark:bg-yellow-900 rounded-full flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-yellow-500">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                  </svg>
                </div>
              </div>
            </div>
            
            <div className="bg-white dark:bg-zinc-800 rounded-lg shadow p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">Total Channels</p>
                  <h3 className="text-2xl font-bold">{stats.counts.channels}</h3>
                </div>
                <div className="h-12 w-12 bg-emerald-100 dark:bg-emerald-900 rounded-full flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-500">
                    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
                    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
                  </svg>
                </div>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-zinc-800 rounded-lg shadow p-4">
              <h3 className="text-lg font-semibold mb-4">Recent Users</h3>
              <div className="space-y-4">
                {stats.recentUsers.length > 0 ? (
                  stats.recentUsers.map((user: any) => (
                    <div key={user._id} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center overflow-hidden">
                          {user.image ? (
                            <img src={user.image} alt={user.name || "User"} className="h-full w-full object-cover" />
                          ) : (
                            <span className="text-indigo-500 font-semibold">
                              {(user.name || "U")[0]?.toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div>
                          <p className="font-medium">{user.name || user.steamName || "Unknown User"}</p>
                          <p className="text-xs text-zinc-500 dark:text-zinc-400">
                            {user.email || user.steamId || user.id}
                          </p>
                        </div>
                      </div>
                      <div className="text-xs text-zinc-500 dark:text-zinc-400">
                        {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "N/A"}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4 text-zinc-500 dark:text-zinc-400">
                    No users found
                  </div>
                )}
              </div>
              <div className="mt-4 text-right">
                <a href="/admin/users" className="text-sm text-indigo-500 hover:underline">
                  View all users →
                </a>
              </div>
            </div>
            
            <div className="bg-white dark:bg-zinc-800 rounded-lg shadow p-4">
              <h3 className="text-lg font-semibold mb-4">Recent Servers</h3>
              <div className="space-y-4">
                {stats.recentServers.length > 0 ? (
                  stats.recentServers.map((server: any) => (
                    <div key={server._id} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-md bg-blue-100 dark:bg-blue-900 flex items-center justify-center overflow-hidden">
                          {server.icon ? (
                            <img src={server.icon} alt={server.name} className="h-full w-full object-cover" />
                          ) : (
                            <span className="text-blue-500 font-semibold">
                              {(server.name || "S")[0]?.toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div>
                          <p className="font-medium">{server.name || "Unnamed Server"}</p>
                          <p className="text-xs text-zinc-500 dark:text-zinc-400">
                            {server.id || server._id}
                          </p>
                        </div>
                      </div>
                      <div className="text-xs text-zinc-500 dark:text-zinc-400">
                        {server.createdAt ? new Date(server.createdAt).toLocaleDateString() : "N/A"}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4 text-zinc-500 dark:text-zinc-400">
                    No servers found
                  </div>
                )}
              </div>
              <div className="mt-4 text-right">
                <a href="/admin/servers" className="text-sm text-blue-500 hover:underline">
                  View all servers →
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
