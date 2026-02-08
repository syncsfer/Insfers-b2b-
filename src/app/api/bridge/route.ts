import { NextResponse } from 'next/server';
import type { BridgeRequest, BridgeResult, BridgeStep } from '@/lib/bridge';

/**
 * POST /api/bridge — Initiate a CCTP bridge transfer to Arc Testnet.
 *
 * Requires Circle API credentials in environment variables:
 *   CIRCLE_API_KEY, CIRCLE_ENTITY_SECRET
 *
 * Body: { sourceChain, amount, sourceAddress, destinationAddress }
 */
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as BridgeRequest;

    // Validate required fields
    if (!body.sourceChain || !body.amount || !body.sourceAddress || !body.destinationAddress) {
      return NextResponse.json(
        { error: 'Missing required fields: sourceChain, amount, sourceAddress, destinationAddress' },
        { status: 400 },
      );
    }

    const amount = parseFloat(body.amount);
    if (isNaN(amount) || amount <= 0) {
      return NextResponse.json({ error: 'Amount must be a positive number' }, { status: 400 });
    }

    // Check for Circle credentials
    const apiKey = process.env.CIRCLE_API_KEY;
    const entitySecret = process.env.CIRCLE_ENTITY_SECRET;

    if (!apiKey || !entitySecret) {
      return NextResponse.json(
        {
          error: 'Circle API credentials not configured. Set CIRCLE_API_KEY and CIRCLE_ENTITY_SECRET environment variables.',
          instructions: {
            step1: 'Create a Circle Developer Console account at https://console.circle.com',
            step2: 'Create an API key: Keys → Create a key → API key → Standard Key',
            step3: 'Register your Entity Secret',
            step4: 'Add CIRCLE_API_KEY and CIRCLE_ENTITY_SECRET to your .env file',
          },
        },
        { status: 503 },
      );
    }

    // Dynamic import — Bridge Kit is a server-side dependency
    const { BridgeKit } = await import('@circle-fin/bridge-kit');
    const { createCircleWalletsAdapter } = await import('@circle-fin/adapter-circle-wallets');

    const kit = new BridgeKit();
    const adapter = createCircleWalletsAdapter({ apiKey, entitySecret });

    const steps: BridgeStep[] = [];

    const result = await kit.bridge({
      from: {
        adapter,
        chain: body.sourceChain,
        address: body.sourceAddress,
      },
      to: {
        adapter,
        chain: 'Arc_Testnet',
        address: body.destinationAddress,
      },
      amount: body.amount,
    });

    // Parse Bridge Kit result into a simplified step array
    if (result && typeof result === 'object' && 'steps' in result) {
      const rawSteps = result.steps as Array<{
        name?: string;
        state?: string;
        txHash?: string;
        explorerUrl?: string;
      }>;
      for (const step of rawSteps) {
        steps.push({
          name: step.name ?? 'unknown',
          state: step.state === 'success' ? 'success' : 'error',
          txHash: step.txHash,
          explorerUrl: step.explorerUrl,
        });
      }
    }

    const bridgeResult: BridgeResult = {
      success: true,
      steps,
    };

    return NextResponse.json(bridgeResult, { status: 200 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown bridge error';
    return NextResponse.json({ success: false, steps: [], error: message } satisfies BridgeResult, { status: 500 });
  }
}

/**
 * GET /api/bridge — Returns bridge configuration and supported chains.
 */
export async function GET() {
  const hasCredentials = !!(process.env.CIRCLE_API_KEY && process.env.CIRCLE_ENTITY_SECRET);

  return NextResponse.json({
    destination: 'Arc_Testnet',
    hasCredentials,
    supportedSourceChains: [
      'Ethereum_Sepolia',
      'Base_Sepolia',
      'Arbitrum_Sepolia',
      'Optimism_Sepolia',
      'Polygon_Amoy_Testnet',
      'Avalanche_Fuji',
      'Unichain_Sepolia',
      'Solana_Devnet',
    ],
    cctpSteps: ['approve', 'burn', 'fetchAttestation', 'mint'],
  });
}
