import { connectToDatabase } from "@/lib/db";

async function getSettings() {
  try {
    const db = await connectToDatabase();
    
    // Get site settings from database
    const settings = await db.collection("settings").findOne({ type: "site" });
    
    return settings || {
      type: "site",
      maintenance: false,
      registrationEnabled: true,
      termsLastUpdated: null,
      recaptchaEnabled: true,
      recaptchaSiteKey: "6Lfv3DMrAAAAAED6cPgz8fjdynqox-4PErFX6js6",
      recaptchaSecretKey: "6Lfv3DMrAAAAAGrO2sFmbq-goszIaQ06miX3r6wB"
    };
  } catch (error) {
    console.error("Error fetching settings:", error);
    return {
      type: "site",
      maintenance: false,
      registrationEnabled: true,
      termsLastUpdated: null,
      recaptchaEnabled: true,
      recaptchaSiteKey: "6Lfv3DMrAAAAAED6cPgz8fjdynqox-4PErFX6js6",
      recaptchaSecretKey: "6Lfv3DMrAAAAAGrO2sFmbq-goszIaQ06miX3r6wB"
    };
  }
}

export default async function AdminSettingsPage() {
  const settings = await getSettings();
  
  return (
    <div className="h-full">
      <div className="flex flex-col">
        <div className="p-6">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-2xl font-bold">Site Settings</h1>
            <div className="flex items-center gap-x-2">
              <button className="bg-rose-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-rose-700">
                Save Changes
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="col-span-2">
              <div className="bg-white dark:bg-zinc-800 rounded-lg shadow p-6 mb-6">
                <h2 className="text-lg font-semibold mb-4">General Settings</h2>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">Maintenance Mode</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        When enabled, only admins can access the site
                      </p>
                    </div>
                    <div className="relative inline-block w-12 h-6 rounded-full bg-gray-200 dark:bg-gray-700">
                      <input 
                        type="checkbox" 
                        id="maintenance-toggle" 
                        className="sr-only"
                        defaultChecked={settings.maintenance}
                      />
                      <label 
                        htmlFor="maintenance-toggle" 
                        className={`absolute inset-0 rounded-full cursor-pointer transition ${
                          settings.maintenance ? 'bg-rose-500' : 'bg-gray-300 dark:bg-gray-600'
                        }`}
                      >
                        <span 
                          className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition transform ${
                            settings.maintenance ? 'translate-x-6' : ''
                          }`}
                        />
                      </label>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">Registration Enabled</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Allow new users to register
                      </p>
                    </div>
                    <div className="relative inline-block w-12 h-6 rounded-full bg-gray-200 dark:bg-gray-700">
                      <input 
                        type="checkbox" 
                        id="registration-toggle" 
                        className="sr-only"
                        defaultChecked={settings.registrationEnabled}
                      />
                      <label 
                        htmlFor="registration-toggle" 
                        className={`absolute inset-0 rounded-full cursor-pointer transition ${
                          settings.registrationEnabled ? 'bg-rose-500' : 'bg-gray-300 dark:bg-gray-600'
                        }`}
                      >
                        <span 
                          className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition transform ${
                            settings.registrationEnabled ? 'translate-x-6' : ''
                          }`}
                        />
                      </label>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-white dark:bg-zinc-800 rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold mb-4">reCAPTCHA Settings</h2>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-medium">Enable reCAPTCHA</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Protect signup form with Google reCAPTCHA
                      </p>
                    </div>
                    <div className="relative inline-block w-12 h-6 rounded-full bg-gray-200 dark:bg-gray-700">
                      <input 
                        type="checkbox" 
                        id="recaptcha-toggle" 
                        className="sr-only"
                        defaultChecked={settings.recaptchaEnabled}
                      />
                      <label 
                        htmlFor="recaptcha-toggle" 
                        className={`absolute inset-0 rounded-full cursor-pointer transition ${
                          settings.recaptchaEnabled ? 'bg-rose-500' : 'bg-gray-300 dark:bg-gray-600'
                        }`}
                      >
                        <span 
                          className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition transform ${
                            settings.recaptchaEnabled ? 'translate-x-6' : ''
                          }`}
                        />
                      </label>
                    </div>
                  </div>
                  
                  <div>
                    <label htmlFor="site-key" className="block text-sm font-medium mb-1">
                      Site Key
                    </label>
                    <input
                      type="text"
                      id="site-key"
                      defaultValue={settings.recaptchaSiteKey}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 dark:bg-zinc-700"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="secret-key" className="block text-sm font-medium mb-1">
                      Secret Key
                    </label>
                    <input
                      type="text"
                      id="secret-key"
                      defaultValue={settings.recaptchaSecretKey}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 dark:bg-zinc-700"
                    />
                  </div>
                </div>
              </div>
            </div>
            
            <div>
              <div className="bg-white dark:bg-zinc-800 rounded-lg shadow p-6 mb-6">
                <h2 className="text-lg font-semibold mb-4">Terms & Conditions</h2>
                
                <div className="space-y-4">
                  <div>
                    <label htmlFor="terms-content" className="block text-sm font-medium mb-1">
                      Content
                    </label>
                    <textarea
                      id="terms-content"
                      rows={10}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 dark:bg-zinc-700"
                      defaultValue={`# Terms and Conditions

Welcome to Gangio!

These terms and conditions outline the rules and regulations for the use of our platform.

## 1. Acceptance of Terms

By accessing this website, you accept these terms and conditions in full. If you disagree with these terms and conditions or any part of them, you must not use this website.

## 2. User Accounts

When you create an account with us, you must provide information that is accurate, complete, and current at all times.

## 3. Content Guidelines

Users are prohibited from posting content that is illegal, harmful, threatening, abusive, harassing, tortious, defamatory, vulgar, obscene, libelous, invasive of another's privacy, hateful, or racially, ethnically or otherwise objectionable.

## 4. Termination

We may terminate or suspend your account immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms.`}
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="terms-updated" className="block text-sm font-medium mb-1">
                      Last Updated
                    </label>
                    <input
                      type="date"
                      id="terms-updated"
                      defaultValue={settings.termsLastUpdated ? new Date(settings.termsLastUpdated).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 dark:bg-zinc-700"
                    />
                  </div>
                  
                  <div className="pt-2">
                    <button className="w-full bg-rose-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-rose-700">
                      Update Terms
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="bg-white dark:bg-zinc-800 rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold mb-4">Database Management</h2>
                
                <div className="space-y-4">
                  <button className="w-full bg-amber-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-amber-700">
                    Backup Database
                  </button>
                  
                  <button className="w-full bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700">
                    Optimize Collections
                  </button>
                  
                  <button className="w-full bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-red-700">
                    Clear Cache
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
