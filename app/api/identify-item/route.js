// api/identify-item/route.js:
import { NextResponse } from 'next/server';
import { run } from '../../lib/gemini'

export async function POST(req) {
    const { imageSrc } = await req.json();
    try {
        const response = await run(imageSrc);
        return NextResponse.json({result: response}, { status: 200 })
    } catch (error) {
        return NextResponse.json({ error: error.message || "An error occurred" }, { status: 500 }); 
    }
}