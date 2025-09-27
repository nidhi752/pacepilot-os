import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { 
          status: 405, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const formData = await req.formData()
    const file = formData.get('file') as File

    if (!file) {
      return new Response(
        JSON.stringify({ error: 'No file provided' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Convert file to base64 for processing
    const arrayBuffer = await file.arrayBuffer()
    const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)))

    // Here you would typically use a document parsing service
    // For now, we'll simulate parsing based on file type
    let extractedText = ''
    const fileName = file.name.toLowerCase()

    if (fileName.endsWith('.txt')) {
      // For text files, just read the content
      extractedText = await file.text()
    } else if (fileName.endsWith('.pdf') || fileName.endsWith('.docx') || fileName.endsWith('.pptx')) {
      // For complex documents, we'd use a parsing service
      // This is a placeholder - in production you'd integrate with:
      // - Adobe PDF Services API
      // - Google Document AI
      // - AWS Textract
      // - Or other document parsing services
      
      extractedText = `[Document parsing placeholder for ${file.name}]\n\nThis is where the extracted text from the ${file.type} file would appear. In a production environment, this would be processed by a document parsing service to extract the actual text content, tables, and other structured data from the file.\n\nFile details:\n- Name: ${file.name}\n- Type: ${file.type}\n- Size: ${file.size} bytes`
    } else {
      extractedText = `Unsupported file type: ${file.type}`
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        text: extractedText,
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error parsing document:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Failed to parse document',
        details: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})