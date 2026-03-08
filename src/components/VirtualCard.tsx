import { motion } from "framer-motion";
import { Wifi } from "lucide-react";

interface VirtualCardProps {
  cardNumber: string;
  expiry: string;
  cvv: string;
  name: string;
}

const VirtualCard = ({ cardNumber, expiry, cvv, name }: VirtualCardProps) => {
  const formatCardNumber = (num: string) =>
    num.replace(/(.{4})/g, "$1 ").trim();

  return (
    <motion.div
      initial={{ opacity: 0, rotateY: -10 }}
      animate={{ opacity: 1, rotateY: 0 }}
      transition={{ duration: 0.6, type: "spring" }}
      className="relative aspect-[1.586/1] w-full max-w-sm overflow-hidden rounded-2xl p-6 gradient-primary"
      style={{
        boxShadow: "0 25px 60px hsl(217 91% 60% / 0.35), 0 0 0 1px hsl(217 91% 80% / 0.1)",
      }}
    >
      {/* Decorative */}
      <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-foreground/5" />
      <div className="absolute -bottom-12 -left-12 h-36 w-36 rounded-full bg-foreground/5" />
      <div className="absolute right-6 top-6 h-10 w-10 rounded-full bg-foreground/10 flex items-center justify-center">
        <Wifi size={18} className="text-primary-foreground/60 rotate-90" />
      </div>

      <div className="relative z-10 flex h-full flex-col justify-between">
        <div>
          <h3 className="text-lg font-bold text-primary-foreground tracking-wider">AbanRemit</h3>
          <p className="text-[10px] text-primary-foreground/50 font-medium">DIGITAL CARD</p>
        </div>

        <div>
          <p className="text-lg font-bold text-primary-foreground tracking-[0.25em] font-mono">
            {formatCardNumber(cardNumber)}
          </p>
        </div>

        <div className="flex items-end justify-between">
          <div>
            <p className="text-[9px] text-primary-foreground/40 uppercase">Card Holder</p>
            <p className="text-xs font-semibold text-primary-foreground/90">{name}</p>
          </div>
          <div className="text-right">
            <p className="text-[9px] text-primary-foreground/40 uppercase">Expires</p>
            <p className="text-xs font-semibold text-primary-foreground/90">{expiry}</p>
          </div>
          <div className="text-right">
            <p className="text-[9px] text-primary-foreground/40 uppercase">CVV</p>
            <p className="text-xs font-semibold text-primary-foreground/90">{cvv}</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default VirtualCard;
