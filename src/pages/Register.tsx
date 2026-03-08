import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, User, Mail, Phone, Lock, MapPin, Calendar, Shield } from "lucide-react";
import { useNavigate } from "react-router-dom";

const steps = ["Personal", "Contact", "Security"];

const Register = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);

  return (
    <div className="min-h-screen gradient-hero flex flex-col">
      <div className="px-5 pt-6">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => step > 0 ? setStep(step - 1) : navigate("/")} className="glass-card flex h-10 w-10 items-center justify-center rounded-xl">
            <ArrowLeft size={18} className="text-foreground" />
          </button>
          <h1 className="text-lg font-bold text-foreground">Create Account</h1>
        </div>

        {/* Progress */}
        <div className="flex gap-2 mb-8">
          {steps.map((s, i) => (
            <div key={s} className="flex-1">
              <div className={`h-1 rounded-full transition-all ${i <= step ? "gradient-primary" : "bg-muted"}`} />
              <p className={`mt-1.5 text-[10px] font-semibold ${i <= step ? "text-primary" : "text-muted-foreground"}`}>{s}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 px-5">
        <AnimatePresence mode="wait">
          {step === 0 && (
            <motion.div key="s0" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1.5 block flex items-center gap-1"><User size={12}/>First Name</label>
                  <input className="input-glass w-full" placeholder="James" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Last Name</label>
                  <input className="input-glass w-full" placeholder="Mwangi" />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1.5 block flex items-center gap-1"><Calendar size={12}/>Date of Birth</label>
                <input type="date" className="input-glass w-full" />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1.5 block flex items-center gap-1"><MapPin size={12}/>Country</label>
                <select className="input-glass w-full">
                  <option>Kenya</option>
                  <option>Nigeria</option>
                  <option>United States</option>
                  <option>United Kingdom</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Address</label>
                <input className="input-glass w-full" placeholder="123 Kenyatta Ave" />
              </div>
            </motion.div>
          )}

          {step === 1 && (
            <motion.div key="s1" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1.5 block flex items-center gap-1"><Mail size={12}/>Email</label>
                <input type="email" className="input-glass w-full" placeholder="james@email.com" />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1.5 block flex items-center gap-1"><Phone size={12}/>Phone Number</label>
                <input type="tel" className="input-glass w-full" placeholder="+254 712 345 678" />
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="s2" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1.5 block flex items-center gap-1"><Lock size={12}/>Password</label>
                <input type="password" className="input-glass w-full" placeholder="••••••••" />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Confirm Password</label>
                <input type="password" className="input-glass w-full" placeholder="••••••••" />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1.5 block flex items-center gap-1"><Shield size={12}/>Wallet PIN (4-6 digits)</label>
                <input type="password" maxLength={6} className="input-glass w-full text-center tracking-[0.5em]" placeholder="••••" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="px-5 pb-8">
        <button
          onClick={() => step < 2 ? setStep(step + 1) : navigate("/dashboard")}
          className="btn-primary-glow w-full rounded-xl py-4 text-sm font-bold text-primary-foreground transition-all flex items-center justify-center gap-2"
        >
          {step < 2 ? "Continue" : "Create Account"}
          <ArrowRight size={16} />
        </button>

        {step === 0 && (
          <p className="mt-4 text-center text-xs text-muted-foreground">
            Already have an account?{" "}
            <button onClick={() => navigate("/login")} className="text-primary font-semibold">Sign In</button>
          </p>
        )}
      </div>
    </div>
  );
};

export default Register;
