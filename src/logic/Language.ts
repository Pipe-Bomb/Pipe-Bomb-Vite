import axios from 'axios';

export default class Language {
	private languageId: string;
	private displayName: string;
	private translations?: Map<string, string>;

	public constructor(languageId: string, displayName: string) {
		this.languageId = languageId;
		this.displayName = displayName;
	}

	/**
	 * Resolve the language data, if not already loaded.
	 */
	public async resolve() : Promise<void> {
		// always update language to ensure the latest translations are present
		const response = await axios.get(`/lang/${this.languageId}.json`); 
		this.translations = new Map(Object.entries(response.data));
	}

	/**
	 * Localise the given translation key to the localised string to use.
	 * @param key the translation key to find the localised translation for.
	 * @returns the localised string to display, without applying any formatting. If there is no translation, will return undefined.
	 */
	public localise(key: string): string | undefined {
		return this.translations?.get(key);
	}
	
	public getDisplayName(): string {
		return this.displayName;
	}

	/**
	 * Get the ID of the translation.
	 * @returns the standard translation id for this translation, such as en-US for English (United States)
	 */
	public getId(): string {
		return this.languageId;
	}
}