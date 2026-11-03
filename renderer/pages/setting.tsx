import { Icon, Spinner } from '@rsuite/icons'
import dayjs from 'dayjs'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { type CSSProperties, useContext, useEffect, useState } from 'react'
import { BsCheck2, BsChevronLeft, BsFillPauseCircleFill, BsFillPlayCircleFill, BsPlus, BsTrash } from 'react-icons/bs'
import { FormattedMessage, useIntl } from 'react-intl'
import { Badge, Button, Content, Divider, Heading, IconButton, Input, Loader, Panel, PanelGroup, Progress, SelectPicker, Stack, useToaster } from 'rsuite'
import NumberForm from '@/components/settings/form/NumberForm'
import RadioBoolean from '@/components/settings/form/RadioBooleanForm'
import RadioForm from '@/components/settings/form/RadioForm'
import SelectForm from '@/components/settings/form/SelectForm'
import alert from '@/components/utils/alert'
import { TheDeskContext } from '@/context'
import { defaultSetting, type Settings as SettingsType } from '@/entities/settings'
import { Context as i18nContext } from '@/i18n'
import { ContextLoadTheme } from '@/theme'
import { getSpotifyPlaylist, nowplayingCode, nowplayingDisconnect, nowplayingInit, spotifyTemplateReplace } from '@/utils/nowplaying'
import { readSettings, saveSetting } from '@/utils/storage'
import StringForm from '@/components/settings/form/StringForm'

const languages = [
	{
		label: 'English',
		value: 'en'
	},
	{
		label: '日本語',
		value: 'ja'
	}
]
const themes = [
	{
		label: 'Dark',
		value: 'dark'
	},
	{
		label: 'Light',
		value: 'light'
	},
	{
		label: 'HighContrast',
		value: 'high-contrast'
	}
]
const time = ['relative', 'absolute', '12h']
const afterPost = ['close', 'stay']
const btnPosition = ['left', 'right']
const beforeLiveTag = ['space', 'break', 'twoLines']
const floating = ['yes', 'no']
const vis = ['public', 'unlisted', 'private', 'direct']
const MAX_SHORTCUT_TEXT = 9

function App() {
	const router = useRouter()
	const { formatMessage } = useIntl()
	const { loadTheme } = useContext(ContextLoadTheme)
	const { switchLang } = useContext(i18nContext)
	const { saveTimelineConfig } = useContext(TheDeskContext)
	const [initiated, setInitiated] = useState(false)
	const [style, setStyle] = useState<CSSProperties>({})
	const [fonts, setFonts] = useState<string[]>([])
	const [isPlaying, setIsPlaying] = useState(false)
	const [isMac, setIsMac] = useState(false)
	const [progressPlaying, setProgressPlaying] = useState(0)
	const [voices, setVoices] = useState<{ value: string; label: string }[]>([])
	const [appearance, setAppearance] = useState<SettingsType['appearance']>(defaultSetting.appearance)
	const [timelineConfig, setTimelineConfig] = useState<SettingsType['timeline']>(defaultSetting.timeline)
	const [compose, setCompose] = useState<SettingsType['compose']>(defaultSetting.compose)
	const [currentPath, setCurrentPath] = useState<string | undefined>(undefined)

	const toast = useToaster()
	const showToaster = (message: string) => toast.push(alert('info', formatMessage({ id: message })), { placement: 'topStart' })
	const [spotifyDev, setSpotifyDev] = useState(true)
	const [spotifyConnected, setSpotifyConnected] = useState(false)
	const [spotifyInitiating, setSpotifyInitiating] = useState(false)
	const [spotifyConnecting, setSpotifyConnecting] = useState(false)
	const [isElectron, setIsElectron] = useState(false)
	const [demoTrack, setDemoTrack] = useState<any>(null)
	const [demoTrackLoading, setDemoTrackLoading] = useState(false)
	const [spotifyCode, setSpotifyCode] = useState('')
	const [spotifyTemp, setSpotifyTemp] = useState('')
	const visLabel = [{ label: formatMessage({ id: 'timeline.settings.notDo' }), value: 'no' }, ...vis.map((value) => ({ label: formatMessage({ id: `compose.visibility.${value}` }), value }))]

	const loadAppearance = () => {
		const lang = localStorage.getItem('lang') || window.navigator.language
		readSettings(lang).then((res) => {
			setStyle({
				fontSize: `${res.appearance.font_size}px`,
				fontFamily: res.appearance.font
			})
			switchLang(res.appearance.language)
			dayjs.locale(res.appearance.language)
			loadTheme()
			saveTimelineConfig(res.timeline)
			document.documentElement.setAttribute('lang', res.appearance.language)
		})
	}
	useEffect(() => {
		setIsElectron(!!window.electronAPI)
		setFonts(['sans-serif', ...JSON.parse(localStorage.getItem('fonts') || '[]')])
		window.speechSynthesis.onvoiceschanged = () => {
			const voices = window.speechSynthesis.getVoices().map((voice) => ({ value: voice.voiceURI, label: `${voice.name} (${voice.lang})` }))
			setVoices([{ value: '', label: formatMessage({ id: 'settings.settings.timeline.ttsVoice.default' }) }, ...voices])
		}
		if (location.protocol !== 'http:') setCurrentPath(location.href.replace('setting.html', ''))
		loadAppearance()
		setSpotifyTemp(localStorage.getItem('spotifyTemplate') || '#NowPlaying {song} / {album} / {artist}\n{url} #{Source}WithTheDesk')
		const f = async () => {
			const settings = await readSettings()
			setAppearance((current) => Object.assign({}, current, settings.appearance))
			setTimelineConfig((current) => Object.assign({}, current, settings.timeline))
			setCompose((current) => Object.assign({}, current, settings.compose))
			setSpotifyConnected(!!localStorage.getItem('spotifyV2Token'))
			setInitiated(true)
		}
		f()
		setSpotifyDev(location.protocol !== 'file:')
		const isMac = localStorage.getItem('os') === 'darwin'
		setIsMac(isMac)
	}, [])
	const handleSubmit = async () => {
		const settings: SettingsType = {
			appearance,
			timeline: timelineConfig,
			compose
		}
		await saveSetting({ obj: settings })
		localStorage.setItem('spotifyTemplate', spotifyTemp)
		showToaster(formatMessage({ id: 'settings.settings.saved' }))
		loadAppearance()
	}

	const updateAppearance = (key: keyof SettingsType['appearance'], value: any) => setAppearance((current) => Object.assign({}, current, { [key]: value }))
	const updateTimeline = (key: keyof SettingsType['timeline'], value: any) => setTimelineConfig((current) => Object.assign({}, current, { [key]: value }))
	const updateCompose = (key: keyof SettingsType['compose'], value: any) => setCompose((current) => Object.assign({}, current, { [key]: value }))
	const labelValueBuilder = (prefix: string, values: string[]) => values.map((value) => ({ label: formatMessage({ id: `settings.settings.${prefix}.${value}` }), value }))
	const shortcutRows = Array.isArray(compose.shortcutText) ? compose.shortcutText : []
	const updateComposeShortcut = (idx: number, value: string) => {
		const base = Array.isArray(compose.shortcutText) ? [...compose.shortcutText] : []
		base[idx] = value
		updateCompose('shortcutText', base)
	}
	const addComposeShortcut = () => {
		if (shortcutRows.length >= MAX_SHORTCUT_TEXT) return
		updateCompose('shortcutText', [...shortcutRows, ''])
	}
	const removeComposeShortcut = (idx: number) => {
		updateCompose(
			'shortcutText',
			shortcutRows.filter((_, i) => i !== idx)
		)
	}
	const nowplayingInitFn = () => {
		setSpotifyInitiating(true)
		nowplayingInit(spotifyDev, showToaster)
	}
	const nowplayingCodeFn = async () => {
		try {
			setSpotifyConnecting(true)
			await nowplayingCode(spotifyCode, showToaster)
			setSpotifyConnected(true)
		} finally {
			setSpotifyConnecting(false)
			setSpotifyInitiating(false)
		}
	}
	const getDemoTrack = async () => {
		setDemoTrackLoading(true)
		try {
			const track = await getSpotifyPlaylist(appearance.language, showToaster)
			setDemoTrack(track)
			window.settingAudio?.pause()
			window.settingAudio = null
			setIsPlaying(false)
			setTimeout(() => setProgressPlaying(0), 500)
		} finally {
			setDemoTrackLoading(false)
		}
	}
	const reloadIsConnected = () => setSpotifyConnected(!!localStorage.getItem('spotifyV2Token'))
	const deleteAllData = () => {
		if (confirm(formatMessage({ id: 'settings.settings.deleteAllDataConfirm' }))) {
			localStorage.clear()
			location.href = './'
		}
	}
	const testSpeech = () => {
		const isBouyomi = timelineConfig.ttsProvider === 'bouyomi'
		const testText = formatMessage({ id: 'settings.settings.timeline.testSpeechManuscript' })
		if (isBouyomi) {
			try {
				fetch(`http://localhost:${timelineConfig.ttsPort}/Talk?text=${encodeURIComponent(testText)}`)
			} catch {
				console.error('Cannot TTS')
			}
		} else {
			const synthApi = window.speechSynthesis
			const utter = new SpeechSynthesisUtterance(testText)
			utter.pitch = timelineConfig.ttsPitch
			utter.rate = timelineConfig.ttsRate
			utter.volume = timelineConfig.ttsVolume / 100
			if (timelineConfig.ttsVoice) {
				const voice = synthApi.getVoices().find((v) => v.voiceURI === timelineConfig.ttsVoice)
				if (voice) utter.voice = voice
			}
			console.log('setting', { pitch: utter.pitch, rate: utter.rate, volume: utter.volume, voice: utter.voice })
			synthApi.speak(utter)
		}
	}
	const play = (url: string) => {
		const audio = window.settingAudio || new Audio(url)
		window.settingAudio = audio
		if (audio.paused) {
			audio.play()
			setIsPlaying(true)
		} else {
			audio.pause()
			setIsPlaying(false)
		}
		audio.onended = () => setIsPlaying(false)
		audio.ontimeupdate = () => setProgressPlaying((audio.currentTime / audio.duration) * 100)
	}
	if (!initiated)
		return (
			<div style={{ textAlign: 'center' }}>
				<Loader style={{ margin: '5em auto' }} />
			</div>
		)
	return (
		<div style={Object.assign({ backgroundColor: 'var(--rs-bg-well)' }, style)}>
			<Head>
				<title>TheDesk</title>
			</Head>
			<Stack justifyContent="space-between" style={{ position: 'fixed', padding: 10, backgroundColor: 'var(--rs-bg-overlay)', width: '100%', zIndex: 999 }}>
				<Button onClick={() => router.push('./', currentPath ? `${currentPath}index.html` : undefined)}>
					<Icon as={BsChevronLeft} style={{ fontSize: '1.4em' }} />
				</Button>
				<Heading style={{ fontSize: '1.3em', fontWeight: 'bold' }}>
					<FormattedMessage id="settings.settings.title" />
				</Heading>
				<Button appearance="primary" color="green" type="submit" onClick={handleSubmit} startIcon={<BsCheck2 />}>
					<FormattedMessage id="settings.settings.save" />
				</Button>
			</Stack>
			<Stack style={{ justifyContent: 'center', display: 'flex' }}>
				<Content style={{ width: 600, maxWidth: '100%', padding: 10, marginTop: 50, marginBottom: 50 }}>
					<p style={{ fontSize: '1.3em', marginTop: 12, fontWeight: 'bold' }}>
						<FormattedMessage id="settings.settings.appearance.title" />
					</p>
					<NumberForm
						label={formatMessage({ id: 'settings.settings.appearance.fontSize' })}
						value={appearance.font_size}
						onChange={(value) => updateAppearance('font_size', value)}
						min={5}
						max={22}
						step={1}
						unit="px"
						fontSize="1.1em"
					/>
					<SelectForm
						label={formatMessage({ id: 'settings.settings.appearance.language' })}
						value={appearance.language}
						onChange={(value) => updateAppearance('language', value)}
						data={languages}
						style={{ width: '100%' }}
						fontSize="1.1em"
					/>
					<SelectForm
						label={formatMessage({ id: 'settings.settings.appearance.colorTheme' })}
						value={appearance.color_theme}
						onChange={(value) => updateAppearance('color_theme', value)}
						data={themes}
						searchable={false}
						style={{ width: '100%' }}
						fontSize="1.1em"
					/>
					<p style={{ marginTop: 15, marginBottom: 5, fontSize: '1.1em' }}>
						<FormattedMessage id="settings.settings.appearance.font" />
					</p>
					<SelectPicker
						value={appearance.font}
						data={fonts.map((value) => ({ label: value === 'sans-serif' ? formatMessage({ id: 'settings.settings.appearance.systemFont' }) : value, value }))}
						searchable={true}
						style={{ width: '100%' }}
						onChange={(value) => updateAppearance('font', value)}
						renderMenuItem={(_label, item) => <p style={{ fontFamily: item.label.toString() }}>{item.label}</p>}
					/>
					<Divider />
					<p style={{ fontSize: '1.3em', marginTop: 12, fontWeight: 'bold' }}>
						<FormattedMessage id="settings.settings.timeline.title" />
					</p>

					<PanelGroup accordion defaultActiveKey={1} bordered>
						<Panel header={formatMessage({ id: 'settings.settings.timeline.category.general' })} eventKey={1}>
							<SelectForm
								label={formatMessage({ id: 'settings.settings.timeline.time.title' })}
								value={timelineConfig.time}
								onChange={(value) => updateTimeline('time', value)}
								data={labelValueBuilder('timeline.time', time)}
								searchable={false}
								style={{ width: '100%' }}
								fontSize="1.1em"
							/>
							<RadioBoolean label={formatMessage({ id: 'settings.settings.timeline.animation' })} value={timelineConfig.animation} onChange={(value) => updateTimeline('animation', value)} />
							<NumberForm
								label={formatMessage({ id: 'settings.settings.timeline.maxLength' })}
								hint={formatMessage({ id: 'settings.settings.timeline.maxLengthHint' })}
								value={timelineConfig.max_length}
								onChange={(value) => updateTimeline('max_length', value > 0 ? Math.max(value, 10) : 0)}
								min={0}
								max={1000}
								step={1}
								unit={formatMessage({ id: 'settings.settings.timeline.maxLengthUnit' })}
								fontSize="1.1em"
							/>
							<RadioBoolean
								label={formatMessage({ id: 'settings.settings.timeline.notification' })}
								hint={formatMessage({ id: 'settings.settings.timeline.notificationHint' })}
								value={timelineConfig.notification}
								onChange={(value) => updateTimeline('notification', value)}
								fontSize="1.1em"
							/>
							<RadioForm
								label={formatMessage({ id: 'settings.settings.timeline.cropImage.title' })}
								hint={formatMessage({ id: 'settings.settings.timeline.cropImage.hint' })}
								value={timelineConfig.cropImage}
								onChange={(value) => updateTimeline('cropImage', value)}
								data={[
									{ label: 'Cover', value: 'cover' },
									{ label: 'Contain', value: 'contain' }
								]}
								fontSize="1.1em"
							/>
							<RadioBoolean
								label={formatMessage({ id: 'settings.settings.timeline.expandCW.title' })}
								hint={formatMessage({ id: 'settings.settings.timeline.expandCW.hint' })}
								value={timelineConfig.expandCW ?? 'no'}
								onChange={(value) => updateTimeline('expandCW', value)}
								fontSize="1.1em"
							/>
							<RadioBoolean
								label={formatMessage({ id: 'settings.settings.timeline.showSensitiveMedia.title' })}
								hint={formatMessage({ id: 'settings.settings.timeline.showSensitiveMedia.hint' })}
								value={timelineConfig.showSensitiveMedia ?? 'no'}
								onChange={(value) => updateTimeline('showSensitiveMedia', value)}
								fontSize="1.1em"
							/>
						</Panel>
						<Panel header={formatMessage({ id: 'settings.settings.timeline.category.tts' })} eventKey={2}>
							<RadioForm
								label={formatMessage({ id: 'settings.settings.timeline.ttsProvider.title' })}
								hint={formatMessage({ id: 'settings.settings.timeline.ttsProvider.hint' })}
								value={timelineConfig.ttsProvider}
								onChange={(value) => updateTimeline('ttsProvider', value)}
								data={labelValueBuilder('timeline.ttsProvider', ['system', 'bouyomi'])}
								fontSize="1.1em"
							/>
							{timelineConfig.ttsProvider === 'bouyomi' ? (
								<NumberForm
									label={formatMessage({ id: 'settings.settings.timeline.ttsPort' })}
									value={timelineConfig.ttsPort}
									onChange={(value) => updateTimeline('ttsPort', value)}
									min={5000}
									max={65535}
									step={1}
									unit=""
									fontSize="1.1em"
								/>
							) : (
								<>
									<NumberForm
										label={formatMessage({ id: 'settings.settings.timeline.ttsPitch.title' })}
										hint={formatMessage({ id: 'settings.settings.timeline.ttsPitch.hint' })}
										value={timelineConfig.ttsPitch}
										onChange={(value) => updateTimeline('ttsPitch', value)}
										min={0.1}
										max={2}
										step={0.1}
										unit=""
										fontSize="1.1em"
									/>
									<NumberForm
										label={formatMessage({ id: 'settings.settings.timeline.ttsRate.title' })}
										hint={formatMessage({ id: 'settings.settings.timeline.ttsRate.hint' })}
										value={timelineConfig.ttsRate}
										onChange={(value) => updateTimeline('ttsRate', value)}
										min={0.1}
										max={10}
										step={0.1}
										unit=""
										fontSize="1.1em"
									/>
									<NumberForm
										label={formatMessage({ id: 'settings.settings.timeline.ttsVolume.title' })}
										hint={formatMessage({ id: 'settings.settings.timeline.ttsVolume.hint' })}
										value={timelineConfig.ttsVolume}
										onChange={(value) => updateTimeline('ttsVolume', value)}
										min={1}
										max={100}
										step={1}
										unit=""
										fontSize="1.1em"
									/>
									<p style={{ marginTop: 15, marginBottom: 5, fontSize: '1.1em' }}>
										<FormattedMessage id="settings.settings.timeline.ttsVoice.title" />
									</p>
									<div style={{ display: 'flex', alignItems: 'center', marginBottom: 10 }}>
										<SelectPicker value={timelineConfig.ttsVoice} data={voices} searchable={true} style={{ width: '100%' }} onChange={(value) => updateTimeline('ttsVoice', value)} />
										<Button onClick={() => testSpeech()} style={{ marginLeft: 5 }}>
											<FormattedMessage id="settings.settings.timeline.testSpeech" />
										</Button>
									</div>
								</>
							)}
						</Panel>

						<Panel header={formatMessage({ id: 'settings.settings.timeline.category.translate' })} eventKey={3}>
							<RadioForm
								label={formatMessage({ id: 'settings.settings.timeline.translateProvider.title' })}
								hint={formatMessage({ id: 'settings.settings.timeline.translateProvider.hint' })}
								value={timelineConfig.translateProvider}
								onChange={(value) => updateTimeline('translateProvider', value)}
								data={[
									{ label: 'DeepL', value: 'deepl' },
									{ label: 'DeepL Pro', value: 'deeplPro' },
									{ label: 'OpenAI Chat Completion API', value: 'openai' }
								]}
								fontSize="1.1em"
							/>
							<StringForm
								label={formatMessage({ id: 'settings.settings.timeline.translateKey' })}
								value={timelineConfig.translateKey}
								onChange={(value) => updateTimeline('translateKey', value)}
								fontSize="1.1em"
							/>
							{timelineConfig.translateProvider !== 'deepl' && (
								<>
									<StringForm
										label={formatMessage({ id: 'settings.settings.timeline.translateEndpoint' })}
										value={timelineConfig.translateEndpoint}
										onChange={(value) => updateTimeline('translateEndpoint', value)}
										fontSize="1.1em"
									/>
									<StringForm
										label={formatMessage({ id: 'settings.settings.timeline.translateModel' })}
										value={timelineConfig.translateModel}
										onChange={(value) => updateTimeline('translateModel', value)}
										fontSize="1.1em"
									/>
									<StringForm
										label={formatMessage({ id: 'settings.settings.timeline.translatePrompt.title' })}
										hint={formatMessage({ id: 'settings.settings.timeline.translatePrompt.hint' })}
										value={timelineConfig.translatePrompt}
										onChange={(value) => updateTimeline('translatePrompt', value)}
										fontSize="1.1em"
										row={3}
									/>
								</>
							)}
						</Panel>
					</PanelGroup>

					<Divider />
					<p style={{ fontSize: '1.3em', marginTop: 12, fontWeight: 'bold' }}>
						<FormattedMessage id="settings.settings.compose.title" />
					</p>
					<RadioForm
						label={formatMessage({ id: 'settings.settings.compose.floating.title' })}
						hint={formatMessage({ id: 'settings.settings.compose.floating.hint' })}
						value={compose.floating}
						onChange={(value) => updateCompose('floating', value)}
						data={labelValueBuilder('compose.floating', floating)}
						fontSize="1.1em"
					/>
					<RadioForm
						label={formatMessage({ id: 'settings.settings.compose.btnPosition.title' })}
						value={compose.btnPosition}
						onChange={(value) => updateCompose('btnPosition', value)}
						data={labelValueBuilder('compose.btnPosition', btnPosition)}
						fontSize="1.1em"
					/>
					<RadioForm
						label={formatMessage({ id: 'settings.settings.compose.afterPost.title' })}
						value={compose.afterPost}
						onChange={(value) => updateCompose('afterPost', value)}
						data={labelValueBuilder('compose.afterPost', afterPost)}
						fontSize="1.1em"
					/>
					<RadioForm
						label={formatMessage({ id: 'settings.settings.compose.beforeLiveTag.title' })}
						value={compose.beforeLiveTag}
						onChange={(value) => updateCompose('beforeLiveTag', value)}
						data={labelValueBuilder('compose.beforeLiveTag', beforeLiveTag)}
						fontSize="1.1em"
					/>
					<SelectForm
						label={formatMessage({ id: 'settings.settings.compose.secondaryToot' })}
						hint={formatMessage({ id: 'settings.settings.compose.secondaryTootHint' })}
						value={compose.secondaryToot}
						onChange={(value) => updateCompose('secondaryToot', value)}
						data={visLabel}
						searchable={false}
						style={{ width: '100%' }}
						fontSize="1.1em"
					/>
					<p style={{ fontSize: '1.1em', marginTop: 12, fontWeight: 'bold' }}>
						<FormattedMessage id="settings.settings.compose.shortcutText.title" />
					</p>
					<p style={{ fontSize: 12, opacity: 0.8 }}>
						<FormattedMessage id="settings.settings.compose.shortcutText.hint" values={{ cmd: isMac ? 'Cmd' : 'Ctrl' }} />
					</p>
					{shortcutRows.map((value, i) => (
						<Stack key={i.toString()} direction="row" alignItems="flex-end" spacing={10} style={{ marginBottom: 4 }}>
							<p style={{ marginBottom: 8 }}><FormattedMessage id="settings.settings.compose.shortcutText.item" values={{ n: i + 1, cmd: isMac ? 'Cmd' : 'Ctrl' }} /></p>
							<div style={{ flex: 1, minWidth: 0 }}>
								<StringForm
									label=""
									value={value}
									onChange={(v) => updateComposeShortcut(i, v)}
									fontSize="1.1em"
								/>
							</div>
							<IconButton
								appearance="subtle"
								icon={<Icon as={BsTrash} />}
								onClick={() => removeComposeShortcut(i)}
								aria-label={formatMessage({ id: 'settings.settings.compose.shortcutText.remove' })}
							/>
						</Stack>
					))}
					<Button appearance="ghost" startIcon={<Icon as={BsPlus} />} disabled={shortcutRows.length >= MAX_SHORTCUT_TEXT} onClick={addComposeShortcut} style={{ marginTop: 8 }}>
						<FormattedMessage id="settings.settings.compose.shortcutText.add" />
					</Button>
					<Divider />
					<p style={{ fontSize: '1.3em', marginTop: 12, fontWeight: 'bold', marginBottom: 10 }}>
						<FormattedMessage id="settings.settings.spotify.title" />
					</p>
					<Button appearance="primary" disabled={spotifyConnected || spotifyInitiating} style={{ marginRight: '5px' }} color="green" onClick={() => nowplayingInitFn()}>
						<FormattedMessage id="settings.settings.spotify.connect" />
					</Button>
					<Button
						appearance="primary"
						disabled={!spotifyConnected}
						color="green"
						onClick={() => {
							nowplayingDisconnect()
							setSpotifyConnected(false)
						}}
					>
						<FormattedMessage id="settings.settings.spotify.disconnect" />
					</Button>
					<Button appearance="link" onClick={() => reloadIsConnected()} style={{ marginLeft: '5px' }}>
						<FormattedMessage id="settings.settings.reload" />
					</Button>
					{spotifyInitiating && spotifyDev && (
						<div style={{ marginTop: '5px' }}>
							<Input value={spotifyCode} onChange={(e) => setSpotifyCode(e)} placeholder={formatMessage({ id: 'settings.settings.spotify.codeHelp' })} />
							<Button appearance="ghost" loading={spotifyConnecting} disabled={!spotifyCode} color="green" onClick={() => nowplayingCodeFn()}>
								<FormattedMessage id="settings.settings.spotify.code" />
							</Button>
						</div>
					)}
					<p style={{ fontSize: '1.3em', marginTop: 12, fontWeight: 'bold' }}>
						<FormattedMessage id="settings.settings.spotify.template" />
					</p>
					<Input as="textarea" rows={3} value={spotifyTemp} onChange={(e) => setSpotifyTemp(e)} onFocus={() => getDemoTrack()} />
					<p style={{ fontSize: 10, margin: 10 }}>
						<FormattedMessage id="settings.settings.spotify.tag" />: {'{song} {album} {artist} {url} {composer} {hz} {bitRate} {lyricist} {bpm} {genre} {Source}'}
					</p>
					{(!!demoTrack || demoTrackLoading) && (
						<div style={{ padding: 5, backgroundColor: 'var(--rs-input-bg)' }}>
							<Badge color="blue" content={formatMessage({ id: 'settings.settings.spotify.demo' })} style={{ marginBottom: 5 }} />
							<div style={{ display: 'flex' }}>
								{demoTrack && !demoTrackLoading && (
									<div
										style={{
											height: 80,
											width: 80,
											marginRight: 10,
											backgroundImage: `url(${demoTrack.album.images[0]?.url || ''})`,
											backgroundSize: 'cover',
											backgroundPosition: 'center',
											borderRadius: 10,
											overflow: 'hidden'
										}}
									>
										<Icon
											onClick={() => play(demoTrack.preview_url)}
											as={isPlaying ? BsFillPauseCircleFill : BsFillPlayCircleFill}
											style={{ fontSize: 30, marginTop: 25, marginLeft: 25, cursor: 'pointer' }}
											className="play-pause-button"
										/>
										<Progress.Line percent={progressPlaying} status={isPlaying ? 'active' : undefined} showInfo={false} />
									</div>
								)}
								{demoTrackLoading ? (
									<p>
										<Loader />
									</p>
								) : (
									<div style={{ width: 'calc(100% - 80px)' }}>{spotifyTemplateReplace(demoTrack, spotifyTemp)}</div>
								)}
							</div>
						</div>
					)}
					<Divider />
					{isElectron && (
						<Button appearance="ghost" onClick={() => window.electronAPI.openAppDataFolder()}>
							<FormattedMessage id="settings.settings.openAppDataFolder" />
						</Button>
					)}

					<Button appearance="primary" color="red" onClick={() => deleteAllData()} style={{ marginLeft: '1em' }}>
						<FormattedMessage id="settings.settings.deleteAllData" />
					</Button>
					<p style={{ fontSize: 10, margin: 10 }}>
						<FormattedMessage id="settings.settings.appDataHint" />
					</p>
				</Content>
			</Stack>
		</div>
	)
}
export default App
