import { motion } from "framer-motion";
import { moduleService } from "../services/moduleService";
import { useTranslation } from "react-i18next";

const MainPage = () => {
  const { t } = useTranslation();
  /* moduleService.listModules().then((result) => {
    console.log("LIST MODULES:", result);
  });*/
  return (
    <>
      <motion.div
        initial={{ opacity: 0, x: 120 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 1 }}
      >
        <h1>{t('mainPage.title')}</h1>
      </motion.div>
    </>
  );
};

export default MainPage;
