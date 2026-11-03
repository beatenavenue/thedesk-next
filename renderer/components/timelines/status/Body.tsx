import type { Entity } from '@cutls/megalodon'
import { type Dispatch, type HTMLAttributes, type SetStateAction, useEffect, useState } from 'react'
import { FormattedMessage } from 'react-intl'
import { Button } from 'rsuite'
import emojify from '@/utils/emojify'
import LinkPreview from './LinkPreview'

type Props = {
	status: Entity.Status
	spoilered: boolean
	spoilerText: string
	setSpoilered: Dispatch<SetStateAction<boolean>>
	onClick?: (e: any) => void
	spoilerReason?: 'spoiler' | 'tooLong'
} & HTMLAttributes<HTMLElement>

const Body: React.FC<Props> = (props) => {
	const { spoilered, setSpoilered, spoilerText, spoilerReason } = props

	const spoiler = () => {
		const isAuto = spoilerReason === 'tooLong'
		if (spoilerText.length > 0) {
			return (
				<div>
					{(!isAuto || spoilered) && (
						<div
							className="spoiler-text"
							style={Object.assign({ overflowWrap: 'break-word', wordBreak: 'break-word' }, props.style)}
							dangerouslySetInnerHTML={{ __html: emojify(spoilerText, props.status.emojis) }}
							onClick={props.onClick}
						/>
					)}
					<Button size="xs" onClick={() => setSpoilered((current) => !current)}>
						{spoilered ? isAuto ? <FormattedMessage id="timeline.status.showMoreAuto" /> : <FormattedMessage id="timeline.status.showMore" /> : <FormattedMessage id="timeline.status.showLess" />}
					</Button>
				</div>
			)
		}
		return null
	}

	return (
		<div className="body">
			{spoiler()}
			{!spoilered && (
				<div
					className="status-body"
					style={Object.assign({ oberflowWrap: 'break-word', wordBreak: 'break-word', userSelect: 'text' }, props.style)}
					dangerouslySetInnerHTML={{ __html: emojify(props.status.content, props.status.emojis) }}
					onClick={props.onClick}
				/>
			)}
			{!spoilered && props.status.card && props.status.card.type === 'link' && <LinkPreview card={props.status.card} />}
		</div>
	)
}

export default Body
