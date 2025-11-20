import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, Mail, Lock, Loader2, Chrome, Languages, Sparkles } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";
import { useLanguage } from "@/lib/language-context";
import { getTranslation } from "@/lib/translations";
import logo from "@assets/generated_images/novii_app_logo.png";

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [birthMonth, setBirthMonth] = useState("");
  const [birthDay, setBirthDay] = useState("");
  const [birthYear, setBirthYear] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { signIn, signUp } = useAuth();
  const { language, setLanguage } = useLanguage();
  const t = getTranslation(language.code);

  const months = language.code === 'ar' 
    ? ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"]
    : ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  
  const days = Array.from({ length: 31 }, (_, i) => i + 1);
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 100 }, (_, i) => currentYear - i);

  const getPasswordStrength = (pwd: string): { score: number; label: string; color: string } => {
    if (!pwd) return { score: 0, label: "", color: "" };
    
    let score = 0;
    if (pwd.length >= 8) score++;
    if (pwd.length >= 12) score++;
    if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) score++;
    if (/\d/.test(pwd)) score++;
    if (/[^a-zA-Z0-9]/.test(pwd)) score++;

    if (score <= 2) return { score, label: t.auth.weak, color: "bg-red-500" };
    if (score <= 3) return { score, label: t.auth.medium, color: "bg-yellow-500" };
    if (score <= 4) return { score, label: t.auth.good, color: "bg-blue-500" };
    return { score, label: t.auth.very_strong, color: "bg-green-500" };
  };

  const passwordStrength = !isLogin ? getPasswordStrength(password) : null;

  const validateForm = (): boolean => {
    if (!email || !password) {
      toast({
        variant: "destructive",
        title: t.auth.validation_error,
        description: t.auth.fill_all_fields,
      });
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast({
        variant: "destructive",
        title: t.auth.email_error,
        description: t.auth.invalid_email,
      });
      return false;
    }

    if (!isLogin) {
      if (!fullName || !username || !birthMonth || !birthDay || !birthYear) {
        toast({
          variant: "destructive",
          title: t.auth.validation_error,
          description: t.auth.fill_all_fields,
        });
        return false;
      }

      if (password.length < 8) {
        toast({
          variant: "destructive",
          title: t.auth.weak_password,
          description: t.auth.password_min_length,
        });
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsLoading(true);

    try {
      if (isLogin) {
        await signIn(email, password);
        toast({
          title: t.auth.login_success,
          description: t.auth.login_success_desc,
        });
      } else {
        await signUp(email, password);
        toast({
          title: t.auth.signup_success,
          description: t.auth.signup_success_desc,
        });
      }
      setLocation("/");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: t.auth.error,
        description: error.message || t.auth.generic_error,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/`,
        },
      });
      
      if (error) throw error;
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: t.auth.error,
        description: error.message || t.auth.google_login_failed,
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black flex items-center justify-center p-4 relative overflow-hidden">
      {/* Language Toggle Button */}
      <div className="absolute top-6 right-6 z-20">
        <Button
          onClick={() => setLanguage(language.code === 'ar' ? 'en' : 'ar')}
          variant="outline"
          className="bg-gray-900/80 backdrop-blur-xl border-gray-700 hover:bg-gray-800/80 text-white gap-2"
        >
          <Languages className="w-4 h-4" />
          <span className="font-medium">{language.code === 'ar' ? 'English' : 'العربية'}</span>
        </Button>
      </div>

      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-purple-500/10 via-pink-500/10 to-transparent rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-tl from-blue-500/10 via-cyan-500/10 to-transparent rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="w-full max-w-6xl flex gap-8 items-center relative z-10">
        {/* Left side - Marketing content */}
        <div className="hidden lg:flex flex-1 flex-col items-center justify-center text-white space-y-8">
          <div className="flex items-center gap-3 animate-in fade-in slide-in-from-left duration-700">
            <img src={logo} alt="Novii" className="w-20 h-20 rounded-2xl shadow-2xl shadow-purple-500/50" />
            <div>
              <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">
                Novii
              </h1>
              <p className="text-sm text-gray-400">{t.auth.platform_tagline}</p>
            </div>
          </div>
          
          <div className="text-center space-y-4 animate-in fade-in slide-in-from-left duration-700 delay-200">
            <h2 className="text-4xl font-light leading-relaxed">
              {t.auth.tagline}{" "}
              <span className="text-transparent bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text font-semibold">
                {t.auth.friends_nearby}
              </span>
            </h2>
          </div>

          <div className="relative animate-in fade-in zoom-in duration-700 delay-500">
            <img
              src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=400&h=400&fit=crop"
              alt="Friends"
              className="w-80 h-80 rounded-3xl object-cover shadow-2xl border-2 border-purple-500/20"
            />
            <div className="absolute -top-4 -left-4 w-14 h-14 rounded-full bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center shadow-lg animate-bounce">
              <span className="text-2xl">❤️</span>
            </div>
            <div className="absolute -bottom-4 -right-4 w-14 h-14 rounded-full bg-gradient-to-br from-green-400 to-cyan-400 flex items-center justify-center shadow-lg animate-bounce delay-500">
              <span className="text-2xl">💬</span>
            </div>
          </div>
        </div>

        {/* Right side - Auth form */}
        <div className="flex-1 max-w-md w-full animate-in fade-in slide-in-from-right duration-700">
          <div className="bg-gray-900/80 backdrop-blur-xl border border-gray-800 rounded-2xl p-8 space-y-6 shadow-2xl">
            <div className="text-center space-y-3">
              <div className="flex justify-center lg:hidden mb-4">
                <img src={logo} alt="Novii" className="w-16 h-16 rounded-xl shadow-xl shadow-purple-500/30" />
              </div>
              <div className="flex items-center justify-center gap-2">
                <h2 className="text-white text-2xl font-bold">
                  {isLogin ? t.auth.welcome_back : t.auth.join_now}
                </h2>
                {isLogin && <Sparkles className="w-6 h-6 text-purple-400" />}
              </div>
              <p className="text-gray-400 text-sm">
                {isLogin ? t.auth.login_subtitle : t.auth.signup_subtitle}
              </p>
            </div>

            {!isLogin ? (
              <>
                <form onSubmit={handleSubmit} className="space-y-3">
                  <Input
                    type="email"
                    placeholder={t.auth.mobile_or_email}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-500 h-10 focus:border-purple-500 focus:ring-purple-500/20 text-sm"
                    dir="ltr"
                  />

                  <Input
                    type="text"
                    placeholder={t.auth.full_name}
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    className="bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-500 h-10 focus:border-purple-500 focus:ring-purple-500/20 text-sm"
                  />

                  <Input
                    type="text"
                    placeholder={t.auth.username}
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    className="bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-500 h-10 focus:border-purple-500 focus:ring-purple-500/20 text-sm"
                    dir="ltr"
                  />

                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder={t.auth.password}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-500 pl-10 h-10 focus:border-purple-500 focus:ring-purple-500/20 text-sm"
                      dir="ltr"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute left-3 top-2.5 text-gray-500 hover:text-gray-300"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs text-gray-400">{t.auth.date_of_birth}</label>
                    <div className="grid grid-cols-3 gap-2">
                      <Select value={birthMonth} onValueChange={setBirthMonth}>
                        <SelectTrigger className="bg-gray-800/50 border-gray-700 text-white h-9 text-xs">
                          <SelectValue placeholder={t.auth.month} />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-800 border-gray-700">
                          {months.map((month, index) => (
                            <SelectItem key={index} value={String(index + 1)} className="text-white hover:bg-gray-700">
                              {month}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <Select value={birthDay} onValueChange={setBirthDay}>
                        <SelectTrigger className="bg-gray-800/50 border-gray-700 text-white h-9 text-xs">
                          <SelectValue placeholder={t.auth.day} />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-800 border-gray-700 max-h-60">
                          {days.map((day) => (
                            <SelectItem key={day} value={String(day)} className="text-white hover:bg-gray-700">
                              {day}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <Select value={birthYear} onValueChange={setBirthYear}>
                        <SelectTrigger className="bg-gray-800/50 border-gray-700 text-white h-9 text-xs">
                          <SelectValue placeholder={t.auth.year} />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-800 border-gray-700 max-h-60">
                          {years.map((year) => (
                            <SelectItem key={year} value={String(year)} className="text-white hover:bg-gray-700">
                              {year}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <p className="text-xs text-gray-500 leading-relaxed">
                    {t.auth.dob_info2}
                  </p>

                  <Button
                    type="submit"
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white h-9 font-semibold text-sm"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                        {t.auth.loading}
                      </>
                    ) : (
                      t.auth.signup_button
                    )}
                  </Button>
                </form>
              </>
            ) : (
              <>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm text-gray-300 font-medium">{t.auth.email}</label>
                    <div className="relative">
                      <Mail className="absolute right-3 top-3 w-5 h-5 text-gray-500" />
                      <Input
                        type="email"
                        placeholder="example@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-500 pr-10 h-11 focus:border-purple-500 focus:ring-purple-500/20"
                        dir="ltr"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm text-gray-300 font-medium">{t.auth.password}</label>
                    <div className="relative">
                      <Lock className="absolute right-3 top-3 w-5 h-5 text-gray-500" />
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-500 pr-10 pl-10 h-11 focus:border-purple-500 focus:ring-purple-500/20"
                        dir="ltr"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute left-3 top-3 text-gray-500 hover:text-gray-300"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="w-4 h-4 rounded border-gray-700 bg-gray-800 text-purple-500 focus:ring-purple-500/20"
                      />
                      <span className="text-sm text-gray-300">{t.auth.remember_me}</span>
                    </label>
                    <button type="button" className="text-sm text-purple-400 hover:text-purple-300">
                      {t.auth.forgot_password}
                    </button>
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white h-11 font-semibold shadow-lg shadow-purple-500/30"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                        {t.auth.loading}
                      </>
                    ) : (
                      t.auth.login_button
                    )}
                  </Button>
                </form>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-700"></div>
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="bg-gray-900 px-2 text-gray-400">{t.auth.or}</span>
                  </div>
                </div>

                <Button
                  type="button"
                  onClick={handleGoogleSignIn}
                  variant="outline"
                  className="w-full bg-white hover:bg-gray-100 text-gray-900 border-gray-300 h-11 font-semibold"
                >
                  <Chrome className="w-5 h-5 ml-2" />
                  {t.auth.continue_with_google}
                </Button>
              </>
            )}
          </div>

          <div className="mt-6 bg-gray-900/60 backdrop-blur-xl border border-gray-800 rounded-xl p-4 text-center">
            <p className="text-gray-400 text-sm">
              {isLogin ? t.auth.no_account : t.auth.have_account}
              <button
                onClick={() => {
                  setIsLogin(!isLogin);
                  setPassword("");
                  setConfirmPassword("");
                  setFullName("");
                  setUsername("");
                  setBirthMonth("");
                  setBirthDay("");
                  setBirthYear("");
                }}
                className="text-purple-400 hover:text-purple-300 font-semibold mr-1"
              >
                {isLogin ? t.auth.create_new_account : t.auth.login_link}
              </button>
            </p>
          </div>

          <div className="mt-8 text-center">
            <p className="text-gray-500 text-xs">
              {t.auth.copyright}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
