import type { localeType } from '../i18n'

type FormBoolean = 'yes' | 'no'
export type Settings = {
	appearance: {
		font_size: number
		language: localeType
		color_theme: ThemeType
		font: string
	}
	timeline: {
		time: 'relative' | 'absolute' | '12h'
		animation: FormBoolean
		max_length: number
		notification: FormBoolean
		cropImage: 'cover' | 'contain'
		expandCW: FormBoolean
		showSensitiveMedia: FormBoolean
		ttsProvider: 'system' | 'bouyomi'
		ttsPort: number
		ttsPitch: number
		ttsRate: number
		ttsVolume: number
		ttsVoice: string
		translateProvider: 'deepl' | 'deeplPro' | 'openai'
		translateEndpoint: string
		translateModel: string
		translateKey: string
		translatePrompt: string
	}
	compose: {
		floating: FormBoolean
		btnPosition: 'left' | 'right'
		afterPost: 'close' | 'stay'
		secondaryToot: 'no' | 'public' | 'unlisted' | 'private' | 'direct'
		shortcutText: string[]
		beforeLiveTag: 'space' | 'break' | 'twoLines'
	}
}

export type ThemeType = 'dark' | 'light' | 'high-contrast'

export const defaultSetting: Settings = {
	appearance: {
		font_size: 14,
		language: 'en',
		color_theme: 'dark',
		font: 'sans-serif'
	},
	timeline: {
		time: 'relative',
		animation: 'yes',
		max_length: 0,
		notification: 'yes',
		cropImage: 'cover',
		expandCW: 'no',
		showSensitiveMedia: 'no',
		ttsProvider: 'system',
		ttsPort: 50080,
		ttsPitch: 1,
		ttsRate: 1,
		ttsVolume: 100,
		ttsVoice: '',
		translateProvider: 'deepl',
		translateEndpoint: '',
		translateModel: '',
		translateKey: '',
		translatePrompt: 'Translate this post to "{language}", output only the translated text:\n{content}'
	},
	compose: {
		floating: 'yes',
		btnPosition: 'right',
		afterPost: 'close',
		secondaryToot: 'no',
		shortcutText: [],
		beforeLiveTag: 'space'
	}
}
