import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    const publicPath = path.join(process.cwd(), 'public', 'sr-logistica.apk');
    const releasePath = path.join(process.cwd(), 'releases', 'sr-logistica.apk');

    const filePath = fs.existsSync(publicPath)
      ? publicPath
      : fs.existsSync(releasePath)
      ? releasePath
      : null;

    if (!filePath) {
      return new NextResponse('Arquivo APK não encontrado no servidor.', { status: 404 });
    }

    const fileBuffer = fs.readFileSync(filePath);

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.android.package-archive',
        'Content-Disposition': 'attachment; filename="sr-logistica.apk"',
        'Content-Length': fileBuffer.length.toString(),
        'Cache-Control': 'public, max-age=3600, must-revalidate',
      },
    });
  } catch (error) {
    console.error('Erro ao disponibilizar APK:', error);
    return new NextResponse('Erro ao processar download do APK.', { status: 500 });
  }
}
