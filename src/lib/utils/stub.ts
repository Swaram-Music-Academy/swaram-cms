export function avatarNameGen({
  firstName,
  lastName,
}: {
  firstName: string;
  lastName: string;
}) {
  return `${firstName}-${lastName}-${Date.now()}.png`;
}
