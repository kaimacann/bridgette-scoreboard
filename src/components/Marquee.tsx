import React from 'react';
import { cn } from '@utils';

export default function Marquee({ terms = [], children, className, duration = 20000, reverse = false }: { terms?: string[]; children?: React.ReactNode; className?: string; duration?: number; reverse?: boolean; pauseOnClick?: boolean; rows?: number }): React.JSX.Element {
	const content = children ?? terms.join('　　');
	return <div className={cn('overflow-hidden whitespace-nowrap', className)}><div className='marquee-line' style={{ animationDuration: `${duration}ms`, animationDirection: reverse ? 'reverse' : undefined }}>{content}　　{content}</div></div>;
}
