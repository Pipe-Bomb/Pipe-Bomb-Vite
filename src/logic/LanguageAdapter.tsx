import Language from "./Language";
import axios from 'axios';
import { ReactNode, isValidElement, cloneElement } from "react";

// Interface for structure of the language metadata file
interface LanguageMeta {
	displayName: string;
}

interface LanguagesIndex {
	languages: {
		[key: string]: LanguageMeta
	},
	primaryDialects: {
		[key: string]: string
	},
	default: string
}

// Interface for Listeners
type LanguageChangeListener = () => void;

let languages : Map<string, Language> = new Map();
let primaryDialects : Map<string, string> = new Map();
let defaultLanguage : Language;
let currentLanguage : Language;

let listeners : LanguageChangeListener[] = [];

/**
 * Get first preferred language by the browser that we also support.
 * In the case of a generic language such as "en" being supported, any particular localisation
 * ("en-US", "en-GB") will match. If the user has a particular localisation preferred for that language,
 * at another point in the list, that will be prioritised.
 * @returns the first language the user's browser prefers that we support. If there are no languages in common, returns
 * the default language.
 */
function getPreferredLanguage() : string {
	if (navigator.languages) {
		// Find first language we support
		for (let language of navigator.languages) {
			let supportedLanguage = getSupportedLanguage(language, navigator.languages);

			if (supportedLanguage) {
				return supportedLanguage;
			}
		}
	} else {
		// old browsers
		let supportedLanguage = getSupportedLanguage(navigator.language, [navigator.language]);

		if (supportedLanguage) {
			return supportedLanguage;
		}
	}

	return defaultLanguage.getId();
}

/**
 * Finds a language code for a supported language that best suits the given language requested.
 * @param language the language to find the supported language for.
 * @param allLanguages the list of all languages requested, to assist with finding the most suitable language.
 * That is, if a generic language code like "en" is requested, this will be checked to see if a more specific version is requested
 * later.
 * @returns the best supported language for the given requested language, or undefined if none match.
 */
function getSupportedLanguage(language: string, allLanguages: readonly string[]): string | undefined {
	// first, prioritise exact matches
	if (languages.has(language)) {
		return language;
	}

	// if a 2-letter code (generic language), find best specific localisation
	if (language.length === 2) {
		// check allLanguages to see if more specific localisation is preferred by the user.
		for (let requestedLanguage of allLanguages) {
			if (requestedLanguage.startsWith(language) && languages.has(requestedLanguage)) {
				return requestedLanguage;
			}
		}

		// check primary dialect
		let primaryDialect = primaryDialects.get(language);

		// ensure the primary dialect actually exists before using it
		if (primaryDialect && languages.has(primaryDialect)) {
			return primaryDialect;
		}

		// check for any version of the language supported
		for (let supportedLanguage of languages.keys()) {
			if (supportedLanguage.startsWith(language)) {
				return supportedLanguage;
			}
		}
	}

	return undefined;
}

export function initialiseLanguageAdapter() {
	// set dummy value for current and default language to begin with.
	defaultLanguage = currentLanguage = new Language("xx-XX", "No Translation");

	// load language index for metadata such as supported languages
	axios.get("/lang/index.json")
	.then(response => response.data)
	.then((data: LanguagesIndex) => {
		// read index data
		for (const [key, value] of Object.entries(data.languages)) {
			languages.set(key, new Language(key, value.displayName));
		}

		for (const [key, value] of Object.entries(data.primaryDialects)) {
			primaryDialects.set(key, value);
		}

		// load default language
		defaultLanguage = loadLanguage(data.default);

		// load preferred language
		loadLanguage(getPreferredLanguage());
	})
	.catch(error => {
		// TODO how should errors be handled? Build in the default en-US translation, or just show translation keys? Show error page?
		console.log(error);
	});
}

export function loadLanguage(language: string) : Language {
	console.log("Loading Language: " + language);

	currentLanguage = languages.get(language);

	// notify all listeners after load
	currentLanguage.resolve().then(() => {
		listeners.forEach(listener => listener());
	});
	
	return currentLanguage;
}

/**
 * Localise the given translation key to the current language.
 * @param key the translation key to localise.
 * @param args the args to substitute for {%d} instances in the localisation.
 * @returns the localisation for the given translation key, searching first in the current language, falling back on the default language, and finally using the translation key
 * if no translation is found.
 */
export function localise(key: string, ...args: ReactNode[]): ReactNode[] {
	let localisedTemplate : string = currentLanguage.localise(key) ?? defaultLanguage.localise(key) ?? key;
	
	// Insert Args
	// First, get the args in order that they are present in the template.
	let indicesToArg : Map<number, ReactNode> = new Map();

	for (let i = 0; i < args.length; i++) {
		let index = localisedTemplate.indexOf(`{${i}}`);
		
		if (index > -1) {
			indicesToArg.set(index, args[i]);
		}
	}

	let orderedIndices = [...indicesToArg.keys()].sort();
	let split = localisedTemplate.split(/{\d+}/);
	let components : ReactNode[] = [];

	// add parts of the split with the args added between components
	for (let i = 0; i < split.length; i++) {
		// append literal, filtering out blank strings that would just become empty spans
		let literal = split[i];
		
		if (literal.length > 0) {
			components.push(literal);
		}
		
		// append arg
		if (i < orderedIndices.length) {
			let index = orderedIndices[i];
			let arg : ReactNode = indicesToArg.get(index);
			
			if (isValidElement(arg)) {
				components.push(cloneElement(arg, { key: "arg_" + i }));
			} else {
				components.push(arg);
			}
		}
	}

	return components;
}

export function registerLanguageChangeListener(listener: LanguageChangeListener): void {
	listeners.push(listener);
}

export function unregisterLanguageChangeListener(listener: LanguageChangeListener): void {
	let i : number = listeners.indexOf(listener);
	
	if (i > -1) {
		listeners.splice(i, 1);
	}
}