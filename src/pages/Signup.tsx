import { Navigation } from "@/components/Navigation";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useRef, useState } from "react";
import luxeLogo from "@/assets/Luxe Estate Logo Design.png";

const SignupPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch("http://127.0.0.1:8000/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          name,
          password,
          avatar,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        // Store the token in localStorage for authentication
        localStorage.setItem("auth:token", data.access_token);
        localStorage.setItem("auth:user", JSON.stringify({ email, name, avatar }));
        window.location.href = "/profile";
      } else {
        const error = await response.json();
        alert(`Signup failed: ${error.detail || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Signup error:", error);
      alert("Signup failed. Please try again.");
    }
  };

  const onPick = () => fileRef.current?.click();
  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setAvatar(String(reader.result || ""));
    reader.readAsDataURL(file);
  };

  return (
    <div className="relative min-h-screen bg-background overflow-hidden">
      {/* Premium black-to-gold gradient with subtle watermark logo (responsive) */}
      <div aria-hidden className="absolute inset-0 -z-10 overflow-hidden">
        {/* Gradient base */}
        <div className="absolute inset-0 bg-gradient-to-br from-black via-[#0b0b0f] to-[#221600]" />
        {/* Soft gold glow accents (responsive sizes) */}
        <div className="pointer-events-none absolute -top-24 -left-24 w-[360px] h-[360px] sm:w-[480px] sm:h-[480px] md:w-[600px] md:h-[600px] rounded-full bg-gradient-to-br from-[#CBA13533] via-[#d4af3733] to-transparent blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 -right-16 w-[420px] h-[420px] sm:w-[560px] sm:h-[560px] md:w-[700px] md:h-[700px] rounded-full bg-gradient-to-tl from-[#CBA13526] via-[#d4af3726] to-transparent blur-3xl" />
        {/* Centered watermark logo (responsive scaling) */}
        <img
          src={luxeLogo}
          alt="Estate Luxe watermark"
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[240px] sm:w-[340px] md:w-[500px] lg:w-[600px] max-w-[82vw] sm:max-w-[70vw] md:max-w-[60vw] opacity-10 mix-blend-screen pointer-events-none drop-shadow-[0_0_30px_rgba(203,161,53,0.25)]"
        />
        {/* Vignette for readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60" />
      </div>
      <Navigation />
      <main className="pt-16">
        <section className="py-20">
          <div className="max-w-md mx-auto px-4">
            <Card className="glass p-8">
              <h1 className="text-3xl font-bold mb-6">Create Account</h1>
              {/* Optional Avatar */}
              <div className="flex items-center gap-4 mb-4">
                <div className="relative w-16 h-16">
                  {avatar ? (
                    <img src={avatar} alt="Avatar" className="w-16 h-16 rounded-full object-cover border border-border/50" />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-muted/30 border border-border/50 flex items-center justify-center text-sm text-muted-foreground">
                      Photo
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" onClick={onPick}>Upload Photo</Button>
                  {avatar && (
                    <Button type="button" variant="outline" onClick={() => setAvatar(null)}>Remove</Button>
                  )}
                </div>
                <input ref={fileRef} className="hidden" type="file" accept="image/*" onChange={onFile} />
              </div>
              <form onSubmit={handleSignup} className="space-y-4">
                <Input placeholder="Full Name" value={name} onChange={(e) => setName(e.target.value)} className="h-12" required />
                <Input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="h-12" required />
                <div className="relative">
                  <Input type={show ? "text" : "password"} placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className="h-12 pr-12" required />
                  <button type="button" onClick={() => setShow((s) => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground hover:text-foreground">
                    {show ? "Hide" : "Show"}
                  </button>
                </div>
                <Button type="submit" className="btn-premium w-full">Sign Up</Button>
                <a href="/login" className="block text-center text-sm text-muted-foreground hover:underline">Already have an account? Login</a>
              </form>
            </Card>
          </div>
        </section>
      </main>
    </div>
  );
};

export default SignupPage;


