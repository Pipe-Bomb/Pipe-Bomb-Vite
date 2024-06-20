import { useState, useEffect, ReactNode } from "react";
import { localise, registerLanguageChangeListener, unregisterLanguageChangeListener } from "../logic/LanguageAdapter";

/**
 * Get the localised string from the provided translation key.
 * @param translationKey the translation key to look up in the current language.
 * @param args arguments to substitute for {0}, {1}, etc... in the localised string.
 */
export default function useTranslation(translationKey: string, ...args: (string | ReactNode)[]) : ReactNode {
	const [translation, setTranslation] = useState(localise(translationKey, args));
	
	function onLanguageChange() {
		setTranslation(localise(translationKey, args));
	}

	useEffect(() => {
		registerLanguageChangeListener(onLanguageChange);

		return () => {
			unregisterLanguageChangeListener(onLanguageChange);
		};
	}, []);
	
	return translation;
}