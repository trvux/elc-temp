# Project Architecture Documentation

This document outlines the Modular Monolith structure for the project, following Domain-Driven Design (DDD) principles.

## Project Structure Tree

```text
src/
├── app/                                    # Next.js App Router - chỉ routing thuần
│   ├── (public)/                           # Layout public
│   │   ├── layout.tsx
│   │   ├── page.tsx                        # Trang chủ
│   │   ├── du-an/
│   │   │   ├── page.tsx
│   │   │   └── [slug]/page.tsx
│   │   ├── san-pham/
│   │   │   ├── page.tsx
│   │   │   └── [slug]/page.tsx
│   │   ├── dich-vu/
│   │   │   ├── page.tsx
│   │   │   └── [slug]/page.tsx
│   │   ├── chi-nhanh/
│   │   │   ├── page.tsx
│   │   │   └── [slug]/page.tsx
│   │   ├── tin-tuc/
│   │   │   ├── page.tsx
│   │   │   └── [slug]/page.tsx
│   │   └── thong-tin/
│   │       ├── page.tsx
│   │       └── [slug]/page.tsx
│   │
│   ├── (admin)/                            # Layout admin
│   │   ├── layout.tsx
│   │   └── admin/
│   │       ├── page.tsx
│   │       ├── categories/page.tsx
│   │       ├── products/page.tsx
│   │       ├── brands/page.tsx
│   │       ├── projects/page.tsx
│   │       ├── branches/page.tsx
│   │       ├── news/page.tsx
│   │       ├── services/page.tsx
│   │       ├── pages/page.tsx
│   │       └── settings/page.tsx
│   │
│   ├── api/                                # Route handlers nếu cần
│   │   └── revalidate/route.ts
│   │
│   ├── layout.tsx                          # Root layout
│   └── globals.css
│
├── modules/
│   │
│   ├── category/                           # Shared module - dùng bởi catalog + project
│   │   ├── domain/
│   │   │   ├── types.ts                    # Category interface
│   │   │   ├── constants.ts                # CATEGORY_TYPES = { PRODUCT, PROJECT }
│   │   │   └── validators.ts               # Zod schema
│   │   ├── application/
│   │   │   ├── getCategories.ts
│   │   │   ├── getCategoryBySlug.ts
│   │   │   └── createCategory.ts
│   │   ├── infrastructure/
│   │   │   └── categoryRepo.ts             # Supabase queries
│   │   ├── presentation/
│   │   │   ├── components/
│   │   │   │   ├── CategoryTree.tsx
│   │   │   │   └── CategoryBadge.tsx
│   │   │   └── actions.ts                  # Server Actions
│   │   └── index.ts                        # Public API
│   │
│   ├── catalog/                            # products + brands
│   │   ├── domain/
│   │   │   ├── types.ts                    # Product, Brand interfaces
│   │   │   ├── constants.ts
│   │   │   └── validators.ts
│   │   ├── application/
│   │   │   ├── getProducts.ts
│   │   │   ├── getProductBySlug.ts
│   │   │   ├── getFeaturedProducts.ts
│   │   │   ├── createProduct.ts
│   │   │   ├── updateProduct.ts
│   │   │   ├── getBrands.ts
│   │   │   └── createBrand.ts
│   │   ├── infrastructure/
│   │   │   ├── productRepo.ts
│   │   │   └── brandRepo.ts
│   │   ├── presentation/
│   │   │   ├── components/
│   │   │   │   ├── ProductCard.tsx
│   │   │   │   ├── ProductList.tsx
│   │   │   │   ├── ProductDetail.tsx
│   │   │   │   ├── ProductFilter.tsx
│   │   │   │   └── BrandCard.tsx
│   │   │   ├── hooks/
│   │   │   │   └── useProductFilter.ts
│   │   │   └── actions.ts
│   │   └── index.ts
│   │
│   ├── project/                            # projects
│   │   ├── domain/
│   │   │   ├── types.ts                    # Project interface
│   │   │   ├── constants.ts
│   │   │   └── validators.ts
│   │   ├── application/
│   │   │   ├── getProjects.ts
│   │   │   ├── getProjectBySlug.ts
│   │   │   ├── getFeaturedProjects.ts
│   │   │   └── createProject.ts
│   │   ├── infrastructure/
│   │   │   └── projectRepo.ts
│   │   ├── presentation/
│   │   │   ├── components/
│   │   │   │   ├── ProjectCard.tsx
│   │   │   │   ├── ProjectList.tsx
│   │   │   │   └── ProjectDetail.tsx
│   │   │   └── actions.ts
│   │   └── index.ts
│   │
│   ├── branch/                             # branches + product_branches (stock)
│   │   ├── domain/
│   │   │   ├── types.ts                    # Branch, ProductBranch interfaces
│   │   │   ├── constants.ts                # STOCK_STATUS
│   │   │   └── validators.ts
│   │   ├── application/
│   │   │   ├── getBranches.ts
│   │   │   ├── getBranchBySlug.ts
│   │   │   ├── getStockByProduct.ts        # query product_branches
│   │   │   └── updateStock.ts
│   │   ├── infrastructure/
│   │   │   ├── branchRepo.ts
│   │   │   └── stockRepo.ts               # product_branches table
│   │   ├── presentation/
│   │   │   ├── components/
│   │   │   │   ├── BranchCard.tsx
│   │   │   │   ├── BranchList.tsx
│   │   │   │   └── StockBadge.tsx
│   │   │   └── actions.ts
│   │   └── index.ts
│   │
│   ├── news/
│   │   ├── domain/
│   │   │   ├── types.ts
│   │   │   ├── constants.ts
│   │   │   └── validators.ts
│   │   ├── application/
│   │   │   ├── getNews.ts
│   │   │   ├── getNewsBySlug.ts
│   │   │   └── createNews.ts
│   │   ├── infrastructure/
│   │   │   └── newsRepo.ts
│   │   ├── presentation/
│   │   │   ├── components/
│   │   │   │   ├── NewsCard.tsx
│   │   │   │   ├── NewsList.tsx
│   │   │   │   └── NewsDetail.tsx
│   │   │   └── actions.ts
│   │   └── index.ts
│   │
│   ├── service/
│   │   ├── domain/
│   │   │   ├── types.ts
│   │   │   ├── constants.ts
│   │   │   └── validators.ts
│   │   ├── application/
│   │   │   ├── getServices.ts
│   │   │   ├── getServiceBySlug.ts
│   │   │   └── createService.ts
│   │   ├── infrastructure/
│   │   │   └── serviceRepo.ts
│   │   ├── presentation/
│   │   │   ├── components/
│   │   │   │   ├── ServiceCard.tsx
│   │   │   │   └── ServiceList.tsx
│   │   │   └── actions.ts
│   │   └── index.ts
│   │
│   ├── page/                               # pages + about_blocks
│   │   ├── domain/
│   │   │   ├── types.ts                    # Page, AboutBlock interfaces
│   │   │   └── validators.ts
│   │   ├── application/
│   │   │   ├── getPageBySlug.ts
│   │   │   ├── getAboutBlocks.ts
│   │   │   └── updatePage.ts
│   │   ├── infrastructure/
│   │   │   ├── pageRepo.ts
│   │   │   └── aboutBlockRepo.ts
│   │   ├── presentation/
│   │   │   ├── components/
│   │   │   │   ├── PageRenderer.tsx        # render jsonb content
│   │   │   │   └── AboutBlock.tsx
│   │   │   └── actions.ts
│   │   └── index.ts
│   │
│   └── settings/                           # site_settings + contacts
│       ├── domain/
│       │   ├── types.ts                    # SiteSettings, Contact interfaces
│       │   └── validators.ts
│       ├── application/
│       │   ├── getSiteSettings.ts
│       │   ├── getContacts.ts
│       │   └── updateSettings.ts
│       ├── infrastructure/
│       │   ├── settingsRepo.ts
│       │   └── contactRepo.ts
│       ├── presentation/
│       │   ├── components/
│       │   │   ├── ContactList.tsx
│       │   │   └── SettingsForm.tsx
│       │   └── actions.ts
│       └── index.ts
│
├── shared/                                 # Infrastructure dùng chung, KHÔNG chứa business
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── server.ts                   # createServerClient
│   │   │   ├── client.ts                   # createBrowserClient
│   │   │   └── middleware.ts
│   │   ├── events.ts                       # EventBus cross-module
│   │   ├── errors.ts                       # AppError classes
│   │   └── utils.ts
│   ├── components/                         # UI primitives
│   │   ├── ui/                             # shadcn hoặc custom
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Modal.tsx
│   │   │   └── ...
│   │   ├── layout/
│   │   │   ├── Header.tsx
│   │   │   ├── Footer.tsx
│   │   │   └── Sidebar.tsx
│   │   └── seo/
│   │       └── MetaTags.tsx
│   ├── hooks/
│   │   ├── useDebounce.ts
│   │   └── usePagination.ts
│   └── types/
│       ├── pagination.ts                   # PaginatedResult<T>
│       ├── api.ts                          # ApiResponse<T>
│       └── supabase.ts                     # Generated DB types từ supabase cli
│
└── middleware.ts                           # Auth guard cho /admin
```

## Overview

The project is organized into three main layers:
1. **App Layer (src/app)**: Pure routing and layout configuration using Next.js App Router.
2. **Modules Layer (src/modules)**: Business logic, domain models, and module-specific UI.
3. **Shared Layer (src/shared)**: Infrastructure, UI primitives, and cross-cutting concerns.

## Directory Structure

### 1. App Router (src/app)
Handles routing, layouts, and high-level page composition.

- **(public)**: Public-facing website routes (Home, Projects, Products, Services, etc.)
- **(admin)**: Protected administration dashboard routes.
- **api**: Route handlers for internal API needs (e.g., revalidation).

### 2. Modules (src/modules)
Each directory represents a standalone business module.

#### Module Internal Structure
- **domain/**: Core business logic, types, constants, and validation schemas (Zod).
- **application/**: Use cases and business operations (getters, creators, updaters).
- **infrastructure/**: Data access layer (Supabase repositories, external APIs).
- **presentation/**: React components, hooks, and Server Actions specific to the module.
- **index.ts**: Public API for the module to be used by other modules or the app layer.

#### List of Modules
- **category**: Shared module for managing product and project categories.
- **catalog**: Management of products and brands.
- **project**: Management of company projects and portfolios.
- **branch**: Branch information and product stock management.
- **news**: News, blog posts, and articles.
- **service**: Company services and offerings.
- **page**: Dynamic page content and custom blocks.
- **settings**: Site-wide configuration and contact information.

### 3. Shared (src/shared)
Contains infrastructure and utility code that does not contain business logic.

- **lib/**: Third-party integrations (Supabase clients, event bus, error classes).
- **components/**: UI primitives (shadcn components, layout elements, SEO tags).
- **hooks/**: Generic React hooks (useDebounce, usePagination).
- **types/**: Common TypeScript interfaces (API responses, pagination, DB types).

## Middleware and Guards
- **middleware.ts**: Located at the root, handles authentication guards for the `/admin` routes.

## Design Principles
1. **Encapsulation**: Modules should expose a clean interface through `index.ts`.
2. **Dependency Direction**: The App layer depends on Modules. Modules depend on Shared. Modules should minimize dependencies on each other.
3. **Type Safety**: Use generated Supabase types and Zod schemas for end-to-end type safety. Strictly forbidden to use the `any` type.
