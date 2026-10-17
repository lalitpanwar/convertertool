export default function ErrorNotice({ message }: { message: string }) {
  return (
    <p role="alert" class="rounded-card bg-danger-soft px-4 py-3 text-sm text-danger">
      {message}
    </p>
  );
}
