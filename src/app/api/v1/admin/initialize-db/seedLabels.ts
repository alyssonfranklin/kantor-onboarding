import { dbConnect } from '@/lib/mongodb/connect';
import Label from '@/lib/mongodb/models/label.model';

/**
 * Seeds the database with initial labels in all supported languages
 * Used for development and testing
 */
export async function seedLabels() {
  try {
    console.log('Starting label seeding process...');
    
    await dbConnect();
    
    // Check if we already have labels
    const existingCount = await Label.countDocuments();
    if (existingCount > 0) {
      console.log(`Found ${existingCount} existing labels, skipping seed`);
      return { success: true, message: `Skipped seeding, ${existingCount} labels already exist` };
    }
    
    // Essential labels to seed
    const labels = [
      {
        key: 'welcome_title',
        en: 'Welcome to Voxerion',
        pt: 'Bem-vindo ao Voxerion',
        es: 'Bienvenido a Voxerion'
      },
      {
        key: 'welcome_desc',
        en: 'A personal assistant that helps you to better communicate with your employees helping you to become a better leader and progress in your career.',
        pt: 'Um assistente pessoal que o ajuda a se comunicar melhor com seus funcionários, ajudando-o a se tornar um líder melhor e progredir em sua carreira.',
        es: 'Un asistente personal que te ayuda a comunicarte mejor con tus empleados, ayudándote a convertirte en un mejor líder y progresar en tu carrera.'
      },
      {
        key: 'welcome_start',
        en: 'Select a calendar event to start.',
        pt: 'Selecione um evento do calendário para começar.',
        es: 'Seleccione un evento del calendario para comenzar.'
      },
      {
        key: 'meeting_starts_in',
        en: 'This meeting starts in',
        pt: 'Esta reunião começa em',
        es: 'Esta reunión comienza en'
      },
      {
        key: 'get_insight',
        en: 'Get Insights',
        pt: 'Obter Insights',
        es: 'Obtener Insights'
      },
      {
        key: 'access_required',
        en: '🔒 Access Required',
        pt: '🔒 Acesso Necessário',
        es: '🔒 Acceso Requerido'
      },
      {
        key: 'contact_admin',
        en: 'Please contact your administrator to get access to Voxerion.',
        pt: 'Entre em contato com o administrador para obter acesso ao Voxerion.',
        es: 'Comuníquese con su administrador para obtener acceso a Voxerion.'
      },
      {
        key: 'contact_support',
        en: 'Contact Support',
        pt: 'Contatar Suporte',
        es: 'Contactar Soporte'
      },
      {
        key: 'try_again',
        en: 'Try Again',
        pt: 'Tentar Novamente',
        es: 'Intentar Nuevamente'
      },
      {
        key: 'refresh',
        en: 'Refresh',
        pt: 'Atualizar',
        es: 'Actualizar'
      }
    ];
    
    console.log(`Seeding ${labels.length} labels...`);
    
    // Insert all labels
    const result = await Label.insertMany(labels);
    console.log(`Successfully seeded ${result.length} labels`);
    
    return { success: true, message: `Successfully seeded ${result.length} labels` };
  } catch (error) {
    console.error('Error seeding labels:', error);
    return { success: false, message: `Error seeding labels: ${(error as Error).message}` };
  }
}