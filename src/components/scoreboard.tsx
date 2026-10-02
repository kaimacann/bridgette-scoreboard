/**
 * astro/src/pages/docs/_custom/scoreboard.tsx
 * Interactive Bridgette strike tracker.
 * Folder boundary: scoreboard custom content; generic Docs state and chrome remain in the parent folder.
 */

/*//////////////////////////////////////////////////
IMPORTS
//////////////////////////////////////////////////*/

// API

import { cn, isNumber, isRec, isString } from '@utils';
import { useCallback, useEffect, useState } from 'react';

// COMPONENTS

import { ErrorBoundary } from '@components/ErrorBoundary';
import Marquee from '@components/Marquee';
import { Button } from '@ui/button';
import { Select, SelectContent, SelectItem, SelectSeparator, SelectTrigger, SelectValue } from '@ui/select';
import { CarbonIcon } from './carbon-icons';
import { neonData } from '../lib/neon';
import { notifyError } from '../lib/error-notifications';

// DATA

import { IMG_DARKEN } from '@components/tile';

// TYPES

import type { PitcherData } from '@lib/types';

/*//////////////////////////////////////////////////
DATA
//////////////////////////////////////////////////*/

const ACTION_ADD = '__add_pitcher__';
const ACTION_DELETE = '__delete_pitcher__';
const COL_CLASSES: Record<1 | 2 | 3, string> = { 1: 'col-start-1', 2: 'col-start-2', 3: 'col-start-3' };
const DEFAULT_PITCHERS: PitcherData[] = [
	{ id: 'kai', name: 'Kai', strikes: 1 },
	{ id: 'daniel', name: 'Daniel', strikes: 1 },
];
type DashboardRecord = { id: string; owner_id: string; title: string; pitchers: PitcherData[] };

/*//////////////////////////////////////////////////
HELPERS
//////////////////////////////////////////////////*/

/**
 * Clamps a numerical value to the range [1, 3].
 *
 * @param v - The numeric value to clamp.
 *
 * @returns The clamped value as 1, 2, or 3.
 */
function clamp(v: number): 1 | 2 | 3 {
	return Math.max(1, Math.min(3, Math.round(v))) as 1 | 2 | 3;
}

/**
 * Coerces an unknown value into an array of pitcher data.
 *
 * @param v - The raw input value.
 *
 * @returns An array of verified and cleaned PitcherData.
 */
function coerce(v: unknown): PitcherData[] {
	return isRec(v) && Array.isArray(v.pitchers)
		? v.pitchers.flatMap((p: unknown): PitcherData[] => {
				if (!isRec(p) || !isString(p.id) || !isString(p.name)) return [];
				const name = p.name.trim();
				return name ? [{ id: p.id, name, strikes: clamp(isNumber(p.strikes) ? p.strikes : 1) }] : [];
			})
		: [];
}

/*//////////////////////////////////////////////////
COMPONENT
//////////////////////////////////////////////////*/

/**
 * Renders the internal scoreboard interactive content.
 *
 * @returns A JSX element representing the scoreboard dashboard interface.
 */
function ScoreboardContent({ account, signOut }: { account: { id: string; email: string }; signOut: () => Promise<void> }): React.JSX.Element {
	// STATES
	const [flash, setFlash] = useState(false);
	const [pitchers, setPitchers] = useState<PitcherData[]>([]);
	const [selId, setSelId] = useState<string | null>(null);
	const [dashboards, setDashboards] = useState<DashboardRecord[]>([]);
	const [dashboardId, setDashboardId] = useState<string | null>(null);
	const [strikeeEmail, setStrikeeEmail] = useState('');
	const [shareMessage, setShareMessage] = useState<string | null>(null);
	const selPitcher = pitchers.find(p => p.id === selId) ?? null;
	const strikes = clamp(selPitcher?.strikes ?? 1);
	const currentDashboard = dashboards.find(board => board.id === dashboardId) ?? null;

	// PROCESS
	const req = useCallback(async <T,>(path: string, init: RequestInit = {}): Promise<T> => neonData<T>(path, init), []);

	const commit = useCallback((nPitchers: PitcherData[], nId?: string | null): void => {
		const sel = (nId && nPitchers.some(p => p.id === nId) && nId) || nPitchers[0]?.id || null;
		setPitchers(nPitchers);
		setSelId(sel);
	}, []);

	const persist = useCallback(
		async (nPitchers: PitcherData[]): Promise<void> => {
			try {
				if (!dashboardId) throw new Error('Choose a scoreboard before saving.');
				await req<DashboardRecord[]>(`scoreboards?id=eq.${encodeURIComponent(dashboardId)}`, {
					method: 'PATCH',
					headers: { Prefer: 'return=representation' },
					body: JSON.stringify({ pitchers: nPitchers, updated_at: new Date().toISOString() }),
				});
			} catch (caught: unknown) {
				notifyError('Scoreboard save', caught, 'Failed to sync dashboard.');
			}
		},
		[dashboardId, req],
	);

	const loadDashboards = useCallback(async (): Promise<void> => {
		try {
			let records = await req<DashboardRecord[]>('scoreboards?select=id,owner_id,title,pitchers&order=created_at.asc');
			if (!records.length) {
				records = await req<DashboardRecord[]>('scoreboards?select=id,owner_id,title,pitchers', {
					method: 'POST',
					headers: { Prefer: 'return=representation' },
					body: JSON.stringify({ title: 'Bridgette’s Strikes', pitchers: DEFAULT_PITCHERS }),
				});
			}
			const requestedId = new URLSearchParams(window.location.search).get('board');
			const selected = records.find(board => board.id === requestedId) ?? records[0];
			if (!selected) throw new Error('No scoreboard is available for this account.');
			setDashboards(records);
			setDashboardId(selected.id);
			setPitchers(coerce({ pitchers: selected.pitchers }));
			setSelId(selected.pitchers[0]?.id ?? null);
		} catch (caught: unknown) {
			notifyError('Scoreboard load', caught, 'Failed to load account scoreboards.');
		}
	}, [req]);

	const shareWithStrikee = useCallback(async (event: React.SubmitEvent<HTMLFormElement>): Promise<void> => {
		event.preventDefault();
		if (!currentDashboard || currentDashboard.owner_id !== account.id) return;
		setShareMessage(null);
		try {
			const email = strikeeEmail.trim().toLowerCase();
			if (email === account.email.toLowerCase()) throw new Error('Choose the strikee’s email address.');
			await req('scoreboard_shares', {
				method: 'POST',
				headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
				body: JSON.stringify({ scoreboard_id: currentDashboard.id, strikee_email: email }),
			});
			const shareUrl = new URL(`/?board=${encodeURIComponent(currentDashboard.id)}`, window.location.origin).toString();
			await navigator.clipboard?.writeText(shareUrl);
			setShareMessage(`Shared with ${email}. The scoreboard link has been copied.`);
			setStrikeeEmail('');
		} catch (caught) {
			notifyError('Scoreboard share', caught, 'Could not share this scoreboard.');
		}
	}, [account.email, account.id, currentDashboard, req, strikeeEmail]);

	// EFFECTS
	useEffect((): void => {
		void loadDashboards();
	}, [loadDashboards]);

	useEffect((): (() => void) | undefined => {
		if (strikes !== 3) {
			setFlash(false);
			return undefined;
		}
		const interval = window.setInterval((): void => {
			setFlash(curr => !curr);
		}, 225);
		return (): void => {
			window.clearInterval(interval);
		};
	}, [strikes]);

	// RENDER
	return (
		<main className='grid min-h-screen grid-rows-[auto_3.5rem_1fr] bg-primary-1'>
			{/* HEADER */}
			<section className='flex flex-col gap-4 bg-secondary-12 p-6 py-20 text-secondary-1 shadow md:flex-row md:items-end md:justify-between'>
				{/* logo */}
				<div>
				<h1 className='text-7xl outline-rose-50' style={{ fontFamily: '"Playball", cursive' }}>
						Bridgette&apos;s Strikes
					</h1>
					<p className='-mt-2 pl-2 text-xl'>Est. 2026</p>
					<p className='mt-2 pl-2 text-sm text-secondary-2'>{account.email}</p>
					<button type='button' className='mt-1 pl-2 text-left text-xs underline text-secondary-2' onClick={() => void signOut()}>Sign out</button>
				</div>
				{/* pitcher */}
				<div className='w-full md:w-56'>
					<p className='mb-2 font-mono text-2xl'>PITCHER</p>
					{dashboards.length > 1 && <label className='mb-2 grid gap-1 text-xs text-secondary-2'>SCOREBOARD<select aria-label='Select scoreboard' value={dashboardId ?? ''} onChange={event => {
						const nextBoard = dashboards.find(board => board.id === event.target.value);
						if (!nextBoard) return;
						setDashboardId(nextBoard.id);
						setPitchers(coerce({ pitchers: nextBoard.pitchers }));
						setSelId(nextBoard.pitchers[0]?.id ?? null);
						window.history.replaceState(null, '', `/?board=${encodeURIComponent(nextBoard.id)}`);
					}} className='rounded border border-secondary-5 bg-secondary-11 px-2 py-2 text-secondary-1'>{dashboards.map(board => <option key={board.id} value={board.id}>{board.title}{board.owner_id === account.id ? ' · creator' : ' · shared'}</option>)}</select></label>}
					<Select
						size='xl'
						onValueChange={v => {
							if (v === ACTION_ADD) {
								const name = window.prompt('Pitcher name')?.trim();
								if (!name) return;
								const next = [...pitchers, { id: crypto.randomUUID(), name, strikes: 1 }];
								commit(next, next.at(-1)?.id ?? null);
								void persist(next);
								return;
							}
							if (v === ACTION_DELETE) {
								if (!selPitcher || !window.confirm(`Delete ${selPitcher.name}?`)) return;
								const next = pitchers.filter(p => p.id !== selPitcher.id);
								commit(next);
								void persist(next);
								return;
							}
							commit(pitchers, v);
						}}
						value={selId ?? undefined}
					>
						<SelectTrigger className='w-full border-secondary-5 bg-secondary-11 font-mono text-secondary-1 data-[placeholder]:text-secondary-2' aria-label='Select pitcher'>
							<SelectValue placeholder='Select pitcher' />
						</SelectTrigger>
						{/* prettier-ignore */}
						<SelectContent className='border-secondary-5 bg-primary-1 text-primary-12'>
							{pitchers.map(p => (<SelectItem key={p.id} value={p.id}>{p.name} · 0{clamp(p.strikes)}{' '}</SelectItem>))}
							<SelectSeparator />
							<SelectItem value={ACTION_ADD}>Add pitcher...</SelectItem>
							<SelectItem disabled={!selPitcher} value={ACTION_DELETE}>{selPitcher ? `Delete ${selPitcher.name}` : 'Delete pitcher'}</SelectItem>
						</SelectContent>
					</Select>
					{currentDashboard?.owner_id === account.id && <form onSubmit={event => void shareWithStrikee(event)} className='mt-3 grid gap-2'>
						<label className='grid gap-1 text-xs text-secondary-2' htmlFor='strikee-email'>Share with a strikee</label>
						<input id='strikee-email' type='email' required placeholder='strikee@example.com' value={strikeeEmail} onChange={event => setStrikeeEmail(event.target.value)} className='rounded border border-secondary-5 bg-secondary-11 px-3 py-2 text-sm text-secondary-1 placeholder:text-secondary-3' />
						<button type='submit' className='rounded border border-secondary-5 px-3 py-2 text-sm text-secondary-1 hover:bg-secondary-11'>Share scoreboard link</button>
						{shareMessage && <p role='status' className='text-xs text-secondary-2'>{shareMessage}</p>}
					</form>}
					{currentDashboard?.owner_id !== account.id && <p className='mt-2 text-xs text-secondary-2/80'>Shared with you by the creator.</p>}
				</div>
				{/* strikes*/}
				<div className='grid gap-x-2'>
					<p className='col-span-3 mb-2 font-mono text-2xl'>STRIKE</p>
					<Button
						variant='outline'
						size='xl'
						className='size-14 border-secondary-4 bg-secondary-1 text-secondary-12 hover:bg-secondary-2'
						aria-label='Decrease strike count'
						disabled={!selPitcher || strikes === 1}
						onClick={(): void => {
							if (!selPitcher) return;
							const n = pitchers.map(p => (p.id === selPitcher.id ? { ...p, strikes: clamp(strikes - 1) } : p));
							commit(n, selPitcher.id);
							void persist(n);
						}}
					>
						<CarbonIcon name='subtract' className='text-3xl' />
					</Button>
					<p className='flex size-14 items-center justify-center rounded border border-secondary-4 bg-primary-12 font-mono text-2xl text-primary-1'>0{strikes}</p>
					<Button
						variant='outline'
						size='xl'
						className='size-14 border-secondary-4 bg-secondary-1 text-secondary-12 hover:bg-secondary-2'
						aria-label='Increase strike count'
						disabled={!selPitcher || strikes === 3}
						onClick={(): void => {
							if (!selPitcher) return;
							const n = pitchers.map(p => (p.id === selPitcher.id ? { ...p, strikes: clamp(strikes + 1) } : p));
							commit(n, selPitcher.id);
							void persist(n);
						}}
					>
						<CarbonIcon name='add' className='text-3xl' />
					</Button>
				</div>
			</section>

			{/* MARQUEE */}
			<div
				className={cn('flex items-center overflow-hidden border-double border-secondary-8 bg-primary-1 transition-opacity duration-75', strikes === 3 ? 'h-full border-y-[6px]' : 'h-0 border-t-[6px]')}
				aria-hidden={strikes !== 3}
			>
				<Marquee terms={["YOU'RE OUT"]} pauseOnClick={false} duration={20000} reverse rows={1} className='!mb-0 font-thin leading-none text-secondary-12' />
			</div>

			{/* IMAGES */}
			<section className='row-start-3 mt-3 grid h-40 min-h-0 grid-cols-[auto_1fr_1fr_auto] items-stretch bg-primary-1 pr-6'>
				<div className={cn('row-start-1 flex h-full items-end justify-end', COL_CLASSES[strikes])}>
					<img
						src={strikes === 3 && flash ? '/images/bridgette/baseball-2.png' : '/images/bridgette/baseball-1.png'}
						alt='Illustration of Bridgette batting'
						className={cn('h-96 w-auto max-w-full object-contain transition-all duration-300', IMG_DARKEN)}
					/>
				</div>
				<div className='col-start-4 flex h-full items-end justify-start'>
					<img src='/images/bridgette/pitcher-2.png' alt='Illustration of the pitcher' className={cn('h-96 w-auto max-w-full object-contain', IMG_DARKEN)} />
				</div>
			</section>
		</main>
	);
}

/**
 * Renders the Bridgette controls and image board.
 *
 * @returns A JSX element representing the strike tracker wrapped in an ErrorBoundary.
 */
export default function Scoreboard({ account, signOut }: { account: { id: string; email: string }; signOut: () => Promise<void> }): React.JSX.Element {
	return (
		<ErrorBoundary
			name='Scoreboard'
		>
			<ScoreboardContent account={account} signOut={signOut} />
		</ErrorBoundary>
	);
}
