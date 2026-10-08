import React, { useEffect, useRef, useState } from 'react';
import { cn } from '@utils';

/**
 * Renders a repeating, screen-reader-friendly marquee for three strikes.
 *
 * @param props - Optional repeated terms or custom children plus motion, row, and accessibility settings for the marquee.
 * @returns The measured marquee viewport and its duplicated animated content.
 */
export default function Marquee({
	terms = [],
	children,
	className,
	duration = 20_000,
	reverse = false,
	'aria-hidden': ariaHidden = false,
}: {
	terms?: string[];
	children?: React.ReactNode;
	className?: string;
	duration?: number;
	reverse?: boolean;
	pauseOnClick?: boolean;
	rows?: number;
	'aria-hidden'?: boolean;
}) {
	const content = children ?? terms.join('　　');
	const viewportRef = useRef<HTMLDivElement>(null);
	const sampleRef = useRef<HTMLSpanElement>(null);
	const [copies, setCopies] = useState(2);

	useEffect(() => {
		const measure = () => {
			const viewportWidth = viewportRef.current?.clientWidth ?? 0;
			const itemWidth = sampleRef.current?.getBoundingClientRect().width ?? 0;
			if (viewportWidth === 0 || itemWidth === 0) return;

			// Fill the visible viewport before duplicating the group for a seamless loop.
			const nCopies = Math.max(2, Math.ceil(viewportWidth / itemWidth) + 1);
			setCopies(current => (current === nCopies ? current : nCopies));
		};

		measure();
		const observer = new ResizeObserver(measure);
		if (viewportRef.current) observer.observe(viewportRef.current);
		if (sampleRef.current) observer.observe(sampleRef.current);
		return () => observer.disconnect();
	}, [content]);

	const renderGroup = (group: number) => (
		<div className='marquee-group' key={group}>
			{Array.from({ length: copies }, (_, i) => (
				<React.Fragment key={i}>
					<span className='marquee-item'>{content}</span>
					<span className='marquee-gap' aria-hidden='true' />
				</React.Fragment>
			))}
		</div>
	);

	return (
		<div ref={viewportRef} className={cn('marquee-viewport relative overflow-hidden whitespace-nowrap', className)} aria-hidden={ariaHidden || undefined}>
			{terms.length > 0 && !ariaHidden && (
				<span className='sr-only' role='status'>
					{terms.join(' ')}
				</span>
			)}
			<span ref={sampleRef} className='marquee-measure' aria-hidden='true'>
				{content}
				<span className='marquee-gap' />
			</span>
			<div
				className='marquee-line'
				aria-hidden='true'
				style={{
					animationDuration: `${duration}ms`,
					animationDirection: reverse ? 'reverse' : undefined,
				}}
			>
				{renderGroup(0)}
				{renderGroup(1)}
			</div>
		</div>
	);
}
