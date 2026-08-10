import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const SAMPLE_PHOTOS = [
  "https://images.unsplash.com/photo-1606041011874-7a77a826b933?w=800",
  "https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=800",
  "https://images.unsplash.com/photo-1598488035139-bdcb1ea43e2e?w=800",
];

async function main() {
  await prisma.platformSettings.upsert({
    where: { id: "default" },
    create: { id: "default", commissionRate: 0.12 },
    update: {},
  });

  const adminPassword = await bcrypt.hash("Admin123!", 12);
  const memberPassword = await bcrypt.hash("Member123!", 12);

  const admin = await prisma.user.upsert({
    where: { email: "support@louetonmatos.fr" },
    create: {
      email: "support@louetonmatos.fr",
      name: "Admin LoueTonMatos",
      passwordHash: adminPassword,
      role: "ADMIN",
      status: "ACTIVE",
      memberSince: new Date(),
      city: "Paris",
      bio: "Compte administrateur de la plateforme.",
      creativeDomain: "OTHER",
      verifiedIdentity: true,
      image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200",
    },
    update: { role: "ADMIN" },
  });

  const member = await prisma.user.upsert({
    where: { email: "membre@louetonmatos.fr" },
    create: {
      email: "membre@louetonmatos.fr",
      name: "Camille Dupont",
      passwordHash: memberPassword,
      role: "MEMBER",
      status: "ACTIVE",
      memberSince: new Date(),
      city: "Paris",
      neighborhood: "11e",
      bio: "Directrice photo indépendante, spécialisée documentaire.",
      creativeDomain: "PHOTOGRAPHER",
      verifiedIdentity: true,
      image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200",
    },
    update: { role: "MEMBER" },
  });

  const listings = [
    {
      title: "Sony FX3 — Kit prêt à tourner",
      description:
        "Sony FX3 en excellent état avec cage SmallRig, 3 batteries et chargeur double. Idéal pour docu et pub.",
      category: "CAMERA" as const,
      pricePerDay: 8500,
      pricePerWeek: 50000,
      condition: "EXCELLENT" as const,
      city: "Paris",
      neighborhood: "République",
      latitude: 48.8674,
      longitude: 2.3635,
      photo: SAMPLE_PHOTOS[0],
    },
    {
      title: "Sigma 24-70mm f/2.8 DG DN Art",
      description: "Objectif zoom polyvalent monture E, parfait pour FX3/A7.",
      category: "LENS" as const,
      pricePerDay: 3500,
      condition: "GOOD" as const,
      city: "Lyon",
      latitude: 45.764,
      longitude: 4.8357,
      photo: SAMPLE_PHOTOS[1],
    },
    {
      title: "Aputure 600d Pro + softbox",
      description: "Projecteur LED bi-couleur avec softbox 90cm.",
      category: "LIGHTING" as const,
      pricePerDay: 12000,
      condition: "EXCELLENT" as const,
      city: "Paris",
      latitude: 48.8566,
      longitude: 2.3522,
      photo: SAMPLE_PHOTOS[2],
    },
  ];

  for (const data of listings) {
    const existing = await prisma.listing.findFirst({
      where: { title: data.title, ownerId: member.id },
    });
    if (existing && data.latitude != null && data.longitude != null) {
      await prisma.listing.update({
        where: { id: existing.id },
        data: { latitude: data.latitude, longitude: data.longitude },
      });
    } else if (!existing) {
      await prisma.listing.create({
        data: {
          title: data.title,
          description: data.description,
          category: data.category,
          pricePerDay: data.pricePerDay,
          pricePerWeek: data.pricePerWeek ?? null,
          condition: data.condition,
          city: data.city,
          neighborhood: data.neighborhood ?? null,
          latitude: data.latitude ?? null,
          longitude: data.longitude ?? null,
          ownerId: member.id,
          status: "ACTIVE",
          deliveryOption: "BOTH",
          deliveryFlatFee: 2500,
          cancellationPolicy: "MODERATE",
          photos: { create: [{ url: data.photo, order: 0 }] },
        },
      });
    }
  }

  const sampleServices = [
    {
      title: "Pilote drone FPV — pub, clip, événementiel",
      description:
        "Pilote FPV certifié, réalisation de plans dynamiques pour clips, pubs et live. Matériel DJI Avata et GoPro incluse sur demande. Disponible Île-de-France.",
      category: "DRONE_FPV_PILOT" as const,
      rateType: "DAILY" as const,
      priceAmount: 45000,
      city: "Paris",
      experienceYears: 5,
      photo: SAMPLE_PHOTOS[0],
    },
    {
      title: "Chef opérateur — fiction & documentaire",
      description:
        "Chef op avec 12 ans d'expérience long-métrage et série. Lumière naturelle et LED, collaboration étroite avec réalisateur·rice.",
      category: "DIRECTOR_OF_PHOTOGRAPHY" as const,
      rateType: "DAILY" as const,
      priceAmount: 65000,
      city: "Lyon",
      experienceYears: 12,
      photo: SAMPLE_PHOTOS[1],
    },
    {
      title: "Monteur·se Premiere Pro — docu & corporate",
      description:
        "Montage narratif, habillage, sous-titrage. Livraison rapide, exports broadcast. Showreel sur demande.",
      category: "EDITOR" as const,
      rateType: "HOURLY" as const,
      priceAmount: 4500,
      city: "Paris",
      experienceYears: 8,
      photo: SAMPLE_PHOTOS[2],
    },
  ];

  for (const data of sampleServices) {
    const existing = await prisma.service.findFirst({
      where: { title: data.title, ownerId: member.id },
    });
    if (!existing) {
      await prisma.service.create({
        data: {
          title: data.title,
          description: data.description,
          category: data.category,
          rateType: data.rateType,
          priceAmount: data.priceAmount,
          city: data.city,
          experienceYears: data.experienceYears,
          ownerId: member.id,
          status: "ACTIVE",
          photos: { create: [{ url: data.photo, order: 0 }] },
        },
      });
    }
  }

  const feedSamples = [
    {
      postType: "ACTU" as const,
      section: "GENERAL" as const,
      title: "LoueTonMatos ouvre son fil d'actualité !",
      body: "Partagez vos projets, vos besoins urgents de matériel et vos actus ici. Bonne communauté à tous.",
      tags: ["bienvenue"],
    },
    {
      postType: "PROJECT" as const,
      section: "PROJETS_CASTING" as const,
      title: "Docu « Lumières du Nord » — tournage terminé",
      body: "Je viens de boucler un docu 52 min pour Arte sur les artisans en Bretagne. Tourné en FX6 + primes. Hâte de partager le lien au montage.",
      tags: ["docu", "arte"],
      projectUrl: "https://vimeo.com",
    },
    {
      postType: "NEED" as const,
      section: "PETITES_ANNONCES" as const,
      title: "Besoin d'une FX3 — dimanche 17 mai à 20h",
      body: "Tournage interview corporate Paris 11e. Kit cage + 2 batteries idéal. Budget ~85€ la journée. Merci !",
      city: "Paris",
      eventAt: new Date("2026-05-17T20:00:00"),
      tags: ["fx3", "urgent"],
    },
  ];

  for (const data of feedSamples) {
    const existing = await prisma.forumPost.findFirst({
      where: { title: data.title, authorId: member.id },
    });
    if (!existing) {
      await prisma.forumPost.create({
        data: {
          authorId: member.id,
          ...data,
        },
      });
    }
  }

  console.log("Seed OK");
  console.log("  Admin : support@louetonmatos.fr / Admin123!");
  console.log("  Membre: membre@louetonmatos.fr / Member123!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
