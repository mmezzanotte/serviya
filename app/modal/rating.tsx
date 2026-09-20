import { useLocalSearchParams, useRouter } from 'expo-router';
import RatingSheet from '@/components/RatingSheet';

export default function RatingModal() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    bookingId: string;
    professionalId: string;
    professionalName: string;
  }>();

  return (
    <RatingSheet
      bookingId={params.bookingId}
      professionalId={params.professionalId}
      professionalName={params.professionalName ?? 'el profesional'}
      onDismiss={() => router.back()}
      onSubmitted={() => {
        router.replace('/(client)/bookings');
      }}
    />
  );
}
