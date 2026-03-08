import { motion, AnimatePresence } from "framer-motion"
import { useEffect, useState } from "react"

const Splash = () => {
  const [show, setShow] = useState(() => !sessionStorage.getItem("splashSeen"))
  useEffect(() => {
    if (show) {
      const t = setTimeout(() => {
        setShow(false)
        sessionStorage.setItem("splashSeen", "1")
      }, 1800)
      return () => clearTimeout(t)
    }
  }, [show])

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-white"
        >
          <motion.img
            src="/logo.png"
            alt="Desideri di Puglia"
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 120, damping: 12, duration: 0.6 }}
            className="w-28 h-28 rounded-full"
          />
        </motion.div>
      )}
    </AnimatePresence>
  )
}
export default Splash
