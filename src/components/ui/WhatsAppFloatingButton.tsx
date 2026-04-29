import React from 'react'
import { getWhatsAppUrl } from '../../config/contactConfig'

const WHATSAPP_MESSAGE = 'Olá! Vim pelo site e gostaria de mais informações sobre os produtos.'

interface WhatsAppFloatingButtonProps {
  message?: string
}

export const WhatsAppFloatingButton: React.FC<WhatsAppFloatingButtonProps> = ({
  message = WHATSAPP_MESSAGE,
}) => {
  const handleWhatsAppClick = () => {
    const whatsappUrl = getWhatsAppUrl(message)
    window.open(whatsappUrl, '_blank')
  }

  return (
    <button
      onClick={handleWhatsAppClick}
      className="fixed bottom-6 right-6 z-50 w-11 h-11 sm:w-14 sm:h-14 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-110 focus:outline-none rounded-full"
      title="Contato WhatsApp"
      aria-label="Enviar mensagem por WhatsApp"
    >
      <svg
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
      >
        {/* Fundo: bolha/círculo verde oficial do WhatsApp */}
        <path
          fill="#25D366"
          d="M12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413A11.822 11.822 0 0012.05 0z"
        />
        {/* Telefone: branco */}
        <path
          fill="#FFFFFF"
          d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.272-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.149-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.67-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.076 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"
        />
      </svg>
    </button>
  )
}

