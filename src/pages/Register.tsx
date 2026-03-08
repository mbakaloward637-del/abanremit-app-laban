import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, User, Mail, Phone, Lock, MapPin, Calendar, Shield, Upload, Camera } from "lucide-react";
import { useNavigate } from "react-router-dom";

const steps = ["Personal", "Contact", "Security", "Verify"];

const Register = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="px-5 pt-6">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => step > 0 ? setStep(step - 1) : navigate("/")} className="back-btn">
            <ArrowLeft size={18} className="text-foreground" />
          </button>
          <h1 className="text-lg font-bold text-foreground">Create Account</h1>
        </div>

        {/* Progress */}
        <div className="flex gap-2 mb-6">
          {steps.map((s, i) => (
            <div key={s} className="flex-1">
              <div className={`h-1 rounded-full transition-all ${i <= step ? "bg-primary" : "bg-border"}`} />
              <p className={`mt-1.5 text-[10px] font-medium ${i <= step ? "text-primary" : "text-muted-foreground"}`}>{s}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 px-5 overflow-y-auto">
        <AnimatePresence mode="wait">
          {step === 0 && (
            <motion.div key="s0" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label-text flex items-center gap-1"><User size={12}/>First Name</label>
                  <input className="input-field" placeholder="James" />
                </div>
                <div>
                  <label className="label-text">Last Name</label>
                  <input className="input-field" placeholder="Mwangi" />
                </div>
              </div>
              <div>
                <label className="label-text">Middle Name (optional)</label>
                <input className="input-field" placeholder="Kiptoo" />
              </div>
              <div>
                <label className="label-text flex items-center gap-1"><Calendar size={12}/>Date of Birth</label>
                <input type="date" className="input-field" />
              </div>
              <div>
                <label className="label-text">Gender</label>
                <select className="input-field">
                  <option value="">Select gender</option>
                  <option>Male</option>
                  <option>Female</option>
                  <option>Other</option>
                </select>
              </div>
              <div>
                <label className="label-text">Nationality</label>
                <input className="input-field" placeholder="Kenyan" />
              </div>
            </motion.div>
          )}

          {step === 1 && (
            <motion.div key="s1" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="space-y-4">
              <div>
                <label className="label-text flex items-center gap-1"><Phone size={12}/>Phone Number</label>
                <input type="tel" className="input-field" placeholder="+254 712 345 678" />
              </div>
              <div>
                <label className="label-text flex items-center gap-1"><Mail size={12}/>Email Address</label>
                <input type="email" className="input-field" placeholder="james@email.com" />
              </div>
              <div>
                <label className="label-text flex items-center gap-1"><MapPin size={12}/>Physical Address</label>
                <input className="input-field" placeholder="123 Kenyatta Ave" />
              </div>
              <div>
                <label className="label-text">City</label>
                <input className="input-field" placeholder="Nairobi" />
              </div>
              <div>
                <label className="label-text">Country</label>
                <select className="input-field">
                  <option>Kenya</option>
                  <option>Nigeria</option>
                  <option>United States</option>
                  <option>United Kingdom</option>
                </select>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="s2" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="space-y-4">
              <div>
                <label className="label-text flex items-center gap-1"><Lock size={12}/>Password</label>
                <input type="password" className="input-field" placeholder="Minimum 8 characters" />
                <p className="text-[10px] text-muted-foreground mt-1">Must be at least 8 characters</p>
              </div>
              <div>
                <label className="label-text">Confirm Password</label>
                <input type="password" className="input-field" placeholder="••••••••" />
              </div>
              <div>
                <label className="label-text flex items-center gap-1"><Shield size={12}/>Transaction PIN (4–6 digits)</label>
                <input type="password" inputMode="numeric" maxLength={6} className="input-field text-center tracking-[0.5em]" placeholder="••••" />
                <p className="text-[10px] text-muted-foreground mt-1">Numeric only, used for all transactions</p>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div key="s3" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="space-y-4">
              <p className="text-sm text-muted-foreground">Upload documents for identity verification.</p>

              {[
                { label: "Government ID (Front)", icon: Upload },
                { label: "Government ID (Back)", icon: Upload },
                { label: "Selfie for Verification", icon: Camera },
              ].map((doc) => (
                <div key={doc.label} className="section-card flex items-center gap-3 cursor-pointer hover:bg-secondary/50 transition-colors">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                    <doc.icon size={20} className="text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">{doc.label}</p>
                    <p className="text-xs text-muted-foreground">Tap to upload</p>
                  </div>
                </div>
              ))}

              <p className="text-[10px] text-muted-foreground">Proof of address is optional but recommended for faster verification.</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="px-5 pb-8 pt-4">
        <button
          onClick={() => step < 3 ? setStep(step + 1) : navigate("/dashboard")}
          className="btn-primary flex items-center justify-center gap-2"
        >
          {step < 3 ? "Continue" : "Create Account"}
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
