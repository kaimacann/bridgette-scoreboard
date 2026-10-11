import { useEffect, useState, type SubmitEvent } from 'react';
import { Toaster } from 'sonner';
import { notifyError } from '../lib/error-notifications';
import { getNeonSession, neonAuth, neonIsConfigured } from '../lib/neon';
import Scoreboard from './scoreboard';
import { Button } from './ui/button';
import { Input } from './ui/input';
const BORDER_SECONDARY_5_BG_PRIMARY_1_CLASS = 'border-secondary-5 bg-primary-1';

/*//////////////////////////////////////////////////
CLASSES
//////////////////////////////////////////////////*/
const GRID_GAP_1_TEXT_SM_CLASS = 'grid gap-1 text-sm';

/**
 * Shows sign-in or account creation before exposing the user's scoreboards.
 *
 * @returns The account loading, authentication, or scoreboard view for the current session.
 */
export default function AccountGate(): React.JSX.Element {
	const [session, setSession] = useState<{
		user: {
			id: string;
			name?: string;
			email: string;
		};
	} | null>(null);
	const [checking, setChecking] = useState(true);
	const [signup, setSignup] = useState(false);
	const [email, setEmail] = useState('');
	const [name, setName] = useState('');
	const [password, setPassword] = useState('');
	const [busy, setBusy] = useState(false);

	useEffect(() => {
		let mounted = true;
		void getNeonSession()
			.then(current => {
				if (mounted) {
					setSession(current);
					setChecking(false);
				}
			})
			.catch(caught => {
				if (mounted) {
					setChecking(false);
					notifyError('Account session', caught, 'Unable to check your account session.');
				}
			});
		if (!neonIsConfigured) notifyError('Account setup', new Error('Neon Auth and Data API URLs are not configured.'), 'Account sign-in is not configured.');
		return () => {
			mounted = false;
		};
	}, []);

	/**
	 * Sends account credentials to Neon Auth and loads the resulting session.
	 *
	 * @param e - Browser form submission whose default navigation is prevented while authentication runs.
	 */
	async function submit(e: SubmitEvent<HTMLFormElement>): Promise<void> {
		e.preventDefault();
		setBusy(true);
		try {
			await neonAuth(signup ? 'sign-up/email' : 'sign-in/email', signup ? { name: name.trim(), email: email.trim(), password } : { email: email.trim(), password });
			const curr = await getNeonSession();
			if (!curr) throw new Error('Sign-in succeeded but the account session could not be loaded. Check the trusted domain in Neon Auth.');
			setSession(curr);
		} catch (caught) {
			notifyError('Account sign-in', caught, 'Account request failed.');
		} finally {
			setBusy(false);
		}
	}

	/** Ends the current Neon Auth session and returns to the sign-in form. */
	async function signOut(): Promise<void> {
		try {
			await neonAuth('sign-out', {});
			setSession(null);
		} catch (caught) {
			notifyError('Account sign-out', caught, 'Could not sign out.');
		}
	}

	return (
		<>
			<Toaster position='top-right' richColors toastOptions={{ duration: 8000, classNames: { error: 'toast-error-saturated' } }} />
			{checking && <div className='grid min-h-screen place-items-center bg-primary-1 text-primary-12'>Loading account…</div>}
			{!checking && session && <Scoreboard account={{ id: session.user.id, email: session.user.email }} signOut={signOut} />}
			{!checking && !session && (
				<main className='grid min-h-screen place-items-center bg-primary-1 p-6 text-primary-12'>
					<section className='w-full max-w-md rounded-lg border border-secondary-5 bg-primary-2 p-8 shadow-sm'>
						<h1 className='mb-2 text-3xl' style={{ fontFamily: '"Playball", cursive' }}>
							Bridgette&apos;s Strikes
						</h1>
						<p className='mb-6 text-sm'>Sign in to keep your scoreboard with your account and share it with a strikee.</p>
						{!neonIsConfigured ? (
							<p role='status' className='rounded border border-secondary-6 bg-primary-1 p-4 text-sm'>
								Connect Neon Auth and the Data API to enable account sign-in.
							</p>
						) : (
							<form className='grid gap-4' onSubmit={e => void submit(e)}>
								{signup && (
									<label className={GRID_GAP_1_TEXT_SM_CLASS}>
										Name
										<Input required autoComplete='name' value={name} onChange={e => setName(e.target.value)} className={BORDER_SECONDARY_5_BG_PRIMARY_1_CLASS} />
									</label>
								)}
								<label className={GRID_GAP_1_TEXT_SM_CLASS}>
									Email
									<Input required type='email' autoComplete='email' value={email} onChange={e => setEmail(e.target.value)} className={BORDER_SECONDARY_5_BG_PRIMARY_1_CLASS} />
								</label>
								<label className={GRID_GAP_1_TEXT_SM_CLASS}>
									Password
									<Input
										required
										type='password'
										autoComplete={signup ? 'new-password' : 'current-password'}
										minLength={8}
										value={password}
										onChange={e => setPassword(e.target.value)}
										className={BORDER_SECONDARY_5_BG_PRIMARY_1_CLASS}
									/>
								</label>
								<Button variant='secondary' size='lg' disabled={busy}>
									{busy ? 'Please wait…' : signup ? 'Create account' : 'Sign in'}
								</Button>
								<Button type='button' variant='primary-underline' size='link' onClick={() => setSignup(!signup)}>
									{signup ? 'Already have an account? Sign in' : 'Create an account'}
								</Button>
							</form>
						)}
					</section>
				</main>
			)}
		</>
	);
}
