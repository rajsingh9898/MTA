"use client"

import { ProfileDropdown } from "@/components/ui/profile-dropdown"

export default function ProfileDemoPage() {
    return (
        <div className="min-h-screen relative">
            {/* Travel-themed background */}
            <div className="fixed inset-0 bg-gradient-to-br from-amber-50 via-cream-50 to-yellow-50" />
            <div 
                className="fixed inset-0 opacity-[0.04]"
                style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='800' height='400' viewBox='0 0 800 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' stroke='%2378716C' stroke-width='0.5' fill-opacity='0.1'%3E%3Cpath d='M100 200 Q200 150 300 200 T500 200 Q600 150 700 200'/%3E%3Cpath d='M150 180 Q250 130 350 180 T550 180'/%3E%3Cpath d='M200 220 Q300 270 400 220 T600 220'/%3E%3Ccircle cx='200' cy='180' r='3' fill='%2378716C'/%3E%3Ccircle cx='400' cy='200' r='3' fill='%2378716C'/%3E%3Ccircle cx='600' cy='180' r='3' fill='%2378716C'/%3E%3C/g%3E%3C/svg%3E")`,
                    backgroundSize: '800px 400px',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'repeat',
                }}
            />
            
            <div className="relative z-10 p-8">
                <h1 className="text-2xl font-bold mb-4">Profile Dropdown Demo</h1>
                <p className="text-muted-foreground mb-8">
                    Click the profile icon in the top-right corner to see the dropdown in action.
                </p>
                
                <div className="fixed top-4 right-4">
                    <ProfileDropdown />
                </div>

                <div className="max-w-2xl mx-auto space-y-6">
                    <div className="p-6 border border-border rounded-lg">
                        <h2 className="text-lg font-semibold mb-2">Features</h2>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                            <li>• Profile avatar with user name and email display</li>
                            <li>• Expandable "Manage Account" section with smooth animations</li>
                            <li>• Account management options (Change Password, Email, Delete Account)</li>
                            <li>• Dark theme compatible with existing MTA design</li>
                            <li>• Hover effects and transitions</li>
                        </ul>
                    </div>

                    <div className="p-6 border border-border rounded-lg">
                        <h2 className="text-lg font-semibold mb-2">Integration</h2>
                        <p className="text-sm text-muted-foreground">
                            The ProfileDropdown component is now integrated into the main navbar and will appear 
                            on all pages. It uses the existing shadcn/ui components and follows the project's 
                            design system.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
