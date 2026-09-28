/**
 * astro/src/pages/docs/_custom/scoreboard.tsx
 * Interactive Bridgette strike tracker.
 * Folder boundary: scoreboard custom content; generic Docs state and chrome remain in the parent folder.
 */

/*//////////////////////////////////////////////////
IMPORTS
//////////////////////////////////////////////////*/

// API

import { cn, hasWindow, isNumber, isRec, isString, toErrMsg } from '@utils';
import { error as logError, errorLog } from '@utils';
import { useCallback, useEffect, useState } from 'react';

// COMPONENTS

import { ErrorBoundary } from '@components/ErrorBoundary';
import Marquee from '@components/Marquee';
import { Alert, AlertDescription, AlertError, AlertTitle } from '@ui/alert';
import { Button } from '@ui/button';
import { Select, SelectContent, SelectItem, SelectSeparator, SelectTrigger, SelectValue } from '@ui/select';
import { CarbonIcon } from './carbon-icons';

// DATA

import { IMG_DARKEN } from '@components/tile';

// TYPES

import type { BridgetteDashboardData, PitcherData } from '@lib/types';

/*//////////////////////////////////////////////////
DATA
//////////////////////////////////////////////////*/

const ACTION_ADD = '__add_pitcher__';
const ACTION_DELETE = '__delete_pitcher__';
const STORAGE_KEY = 'bridgette-dashboard';
const COL_CLASSES: Record<1 | 2 | 3, string> = { 1: 'col-start-1', 2: 'col-start-2', 3: 'col-start-3' };

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

/**
 * Reads and parses pitcher scoreboard data from localStorage.
 *
 * @returns The parsed local scoreboard state or null if empty or malformed.
 */
function readLocal(): { pitchers: PitcherData[]; selectedId: string | null } | null {
	if (!hasWindow()) return null;
	try {
		const v = window.localStorage.getItem(STORAGE_KEY);
		if (!v) return null;
		const parsed = JSON.parse(v) as { pitchers?: unknown; selectedId?: unknown };
		return { pitchers: coerce({ pitchers: parsed.pitchers }), selectedId: isString(parsed.selectedId) ? parsed.selectedId : null };
	} catch (caught: unknown) {
		const errInstance = caught instanceof Error ? caught : new Error(String(caught));
		const payload = logError(errInstance, { storageKey: STORAGE_KEY });
		errorLog('Scoreboard', 'Failed to parse localStorage scoreboard data', payload);
		return null;
	}
}

/**
 * Writes the current pitcher scoreboard data to localStorage.
 *
 * @param pitchers - The list of current pitchers.
 * @param selectedId - The currently selected pitcher's unique identifier.
 */
function writeLocal(pitchers: PitcherData[], selectedId: string | null): void {
	if (!hasWindow()) return;
	try {
		window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ pitchers, selectedId }));
	} catch (caught: unknown) {
		const errInstance = caught instanceof Error ? caught : new Error(String(caught));
		const payload = logError(errInstance, { storageKey: STORAGE_KEY });
		errorLog('Scoreboard', 'Failed to write localStorage scoreboard data', payload);
	}
}

/*//////////////////////////////////////////////////
COMPONENT
//////////////////////////////////////////////////*/

/**
 * Renders the internal scoreboard interactive content.
 *
 * @returns A JSX element representing the scoreboard dashboard interface.
 */
function ScoreboardContent(): React.JSX.Element {
	// STATES
	const [err, setErr] = useState<string | null>(null);
	const [flash, setFlash] = useState(false);
	const [pitchers, setPitchers] = useState<PitcherData[]>([]);
	const [selId, setSelId] = useState<string | null>(null);
	const selPitcher = pitchers.find(p => p.id === selId) ?? null;
	const strikes = clamp(selPitcher?.strikes ?? 1);

	// PROCESS
	const req = useCallback(async <T,>(init?: RequestInit): Promise<T> => {
		const headers = new Headers(init?.headers);
		if (init?.method === 'PUT') {
			let token = window.sessionStorage.getItem('bridgette-editor-token') ?? '';
			if (!token) {
				token = window.prompt('Enter the site editor key')?.trim() ?? '';
				if (!token) throw new Error('Enter the site editor key to save changes.');
				window.sessionStorage.setItem('bridgette-editor-token', token);
			}
			headers.set('Authorization', `Bearer ${token}`);
		}
		const res = await fetch('/api/bridgette', { ...init, headers });
		const data = (await res.json()) as T & { error?: string };
		if (!res.ok) {
			if (res.status === 401 && init?.method === 'PUT') window.sessionStorage.removeItem('bridgette-editor-token');
			throw new Error(isString(data.error) ? data.error : 'Request failed.');
		}
		return data;
	}, []);

	const commit = useCallback((nPitchers: PitcherData[], nId?: string | null): void => {
		const sel = (nId && nPitchers.some(p => p.id === nId) && nId) || nPitchers[0]?.id || null;
		setPitchers(nPitchers);
		setSelId(sel);
		writeLocal(nPitchers, sel);
	}, []);

	const persist = useCallback(
		async (nPitchers: PitcherData[]): Promise<void> => {
			try {
				await req<{ data: BridgetteDashboardData }>({ method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ pitchers: nPitchers }) });
				setErr(null);
			} catch (caught: unknown) {
				const errInstance = caught instanceof Error ? caught : new Error(String(caught));
				const payload = logError(errInstance, { pitcherCount: nPitchers.length });
				errorLog('Scoreboard', 'Failed to persist scoreboard to API', payload);
				setErr(toErrMsg(caught, 'Failed to sync dashboard.'));
			}
		},
		[req],
	);

	// EFFECTS
	useEffect((): void => {
		const local = readLocal();
		if (local) commit(local.pitchers, local.selectedId);
		void req<BridgetteDashboardData>()
			.then(data => {
				if (local) {
					if (JSON.stringify(local.pitchers) !== JSON.stringify(data.pitchers)) void persist(local.pitchers);
					return;
				}
				commit(data.pitchers);
				setErr(null);
			})
			.catch((caught: unknown) => {
				const errInstance = caught instanceof Error ? caught : new Error(String(caught));
				const payload = logError(errInstance);
				errorLog('Scoreboard', 'Failed to fetch scoreboard from API', payload);
				setErr(toErrMsg(caught, 'Failed to load dashboard.'));
			});
	}, [commit, persist, req]);

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
		<div className='grid size-full grid-rows-[auto_3.5rem_1fr]'>
			{/* HEADER */}
			<section className='flex flex-col gap-4 bg-secondary-12 p-6 py-20 text-secondary-1 shadow md:flex-row md:items-end md:justify-between'>
				{/* logo */}
				<div>
					<h1 className='text-7xl outline-rose-50' style={{ fontFamily: '"Playball", cursive' }}>
						Bridgette&apos;s Strikes
					</h1>
					<p className='-mt-2 pl-2 text-xl'>Est. 2026</p>
				</div>
				{/* pitcher */}
				<div className='w-full md:w-56'>
					<p className='mb-2 font-mono text-2xl'>PITCHER</p>
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
					<p className='mt-2 text-xs text-secondary-2/80'>Saving changes requires the site editor key.</p>
					{err && (
						<Alert variant='destructive' className='mb-0 mt-3'>
							<AlertTitle>Dashboard unavailable</AlertTitle>
							<AlertDescription>{err}</AlertDescription>
						</Alert>
					)}
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
		</div>
	);
}

/**
 * Renders the Bridgette controls and image board.
 *
 * @returns A JSX element representing the strike tracker wrapped in an ErrorBoundary.
 */
export default function Scoreboard(): React.JSX.Element {
	return (
		<ErrorBoundary
			name='Scoreboard'
			fallback={() => (
				<AlertError title='Scoreboard Crashed' description='An unexpected rendering error occurred in the Bridgette strike tracker. The rest of the workspace remains fully functional.' />
			)}
		>
			<ScoreboardContent />
		</ErrorBoundary>
	);
}
