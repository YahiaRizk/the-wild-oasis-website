"use server";

import { revalidatePath } from "next/cache";
import { auth, signIn, signOut } from "./auth";
import { supabase } from "./supabase";
import { getBookings } from "./data-service";
import { redirect } from "next/navigation";

export async function updateGuest(formData) {
  // chceck if user is  logged in(authinticated)
  const session = await auth();
  if (!session) throw new Error("You must be logged in");

  const nationalID = formData.get("nationalID");

  const [nationality, countryFlag] = formData.get("nationality").split("%");

  if (!/^[a-zA-Z0-9]{6,12}$/.test(nationalID)) {
    throw new Error("Please enter a valid national ID");
  }
  const updateData = { nationality, countryFlag, nationalID };
  const { data, error } = await supabase
    .from("guests")
    .update(updateData)
    .eq("id", session.user.guestId);

  if (error) {
    throw new Error("Guest could not be updated");
  }
  // This for revalidating the data so that the changes are immediately visible on the page.
  revalidatePath("/account/profile");
}

export async function signInAction() {
  await signIn("google", { redirectTo: "/account" });
}

export async function signOutAction() {
  await signOut({ redirectTo: "/" });
}

export async function createReservation(bookingData, formData) {
  console.log(formData);
}

export async function updateResrvation(formData) {
  // 1-authentication
  // chceck if user is  logged in(authinticated)
  const session = await auth();
  if (!session) throw new Error("You must be logged in");

  const bookingId = Number(formData.get("bookingId"));

  // authorization
  // Check if the user is allowed to delete the booking (disallow user to use cURL to delete bookings that are not theirs)
  const guestBookings = await getBookings(session.user.guestId);
  const guestBookingIds = guestBookings.map((booking) => booking.id);
  if (!guestBookingIds.includes(bookingId)) {
    throw new Error("You are not allowed to edit this booking");
  }

  // 3-create updated data
  // update the booking
  const updateData = {
    numGuests: Number(formData.get("numGuests")),
    observations: formData.get("observations").slice(0, 1000),
  };

  //4- data mutation
  const { error } = await supabase
    .from("bookings")
    .update(updateData)
    .eq("id", bookingId)
    .select()
    .single();

  // 5-error handling
  if (error) {
    throw new Error("Booking could not be updated");
  }

  // 6-revalidate the data
  revalidatePath(`/account/reservations/edit/${bookingId}`);
  revalidatePath("/account/reservations/");

  // 7-redirect the user
  redirect("/account/reservations");
}

export async function deleteReservation(bookingId) {
  // chceck if user is  logged in(authinticated)
  const session = await auth();
  if (!session) throw new Error("You must be logged in");

  // Check if the user is allowed to delete the booking (disallow user to use cURL to delete bookings that are not theirs)
  const guestBookings = await getBookings(session.user.guestId);

  const guestBookingIds = guestBookings.map((booking) => booking.id);

  if (!guestBookingIds.includes(bookingId)) {
    throw new Error("You are not allowed to delete this booking");
  }

  // Delete the booking from database
  const { error } = await supabase
    .from("bookings")
    .delete()
    .eq("id", bookingId);

  if (error) {
    console.error(error);
    throw new Error("Booking could not be deleted");
  }

  // This for revalidating the data so that the changes are immediately visible on the page.
  revalidatePath("/account/reservations");
}
