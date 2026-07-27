import {
  initHome,
  initProducts,
  initBrand,
  initAbout,
  initContact,
  initWishlist,
  initCart,
  initSignin,
  initSignup,
  initProfile,
  initProductDetails,
} from "./pages/index";

export function router() {
  // Pre-load all HTML templates as raw strings at build time via Vite
  const templates = import.meta.glob<string>("./pages/**/*.html", {
    query: "?raw",
    import: "default",
    eager: true,
  });

  const pageCache: { [key: string]: string } = {};
  const urlPageTitle = "JS Single Page Application Router";
  console.log("🚀 ~ router ~ urlPageTitle:", urlPageTitle);

  // Create document click that watches the nav links only
  document.addEventListener("click", (e) => {
    const target = e.target as HTMLAnchorElement | null;
    if (!target || !target.matches("nav a")) return;
    e.preventDefault();
    urlRoute(target.href);
  });

  // Create an object that maps the url to the template, title, and description
  const urlRoutes: { [key: string]: { template: string; title: string; description: string; init?: () => void } } = {
    404: {
      template: "/error/error404.html",
      title: "404 | " + urlPageTitle,
      description: "Page not found",
    },
    "/": {
      template: "/home/home.html",
      title: "Home | " + urlPageTitle,
      description: "This is the home page",
      init: initHome,
    },
    "/products": {
      template: "/products/products.html",
      title: "Products | " + urlPageTitle,
      description: "This is the products page",
      init: initProducts,
    },
    "/product-details": {
      template: "/product-details/product-details.html",
      title: "Product Details | " + urlPageTitle,
      description: "Detailed view of the selected product",
      init: initProductDetails,
    },

    "/brand": {
      template: "/brand/brand.html",
      title: "Brand | " + urlPageTitle,
      description: "This is the brand page",
      init: initBrand,
    },
    "/cart": {
      template: "/cart/cart.html",
      title: "Cart | " + urlPageTitle,
      description: "This is the cart page",
      init: initCart,
    },
    "/wishlist": {
      template: "/wishlist/wishlist.html",
      title: "Wishlist | " + urlPageTitle,
      description: "This is the wishlist page",
      init: initWishlist,
    },
    "/signin": {
      template: "/signin/signin.html",
      title: "Signin | " + urlPageTitle,
      description: "This is the signin page",
      init: initSignin,
    },
    "/signup": {
      template: "/signup/signup.html",
      title: "Signup | " + urlPageTitle,
      description: "This is the signup page",
      init: initSignup,
    },
    "/profile": {
      template: "/profile/profile.html",
      title: "Profile | " + urlPageTitle,
      description: "This is the profile page",
      init: initProfile,
    },
    "/contact": {
      template: "/contact/contact.html",
      title: "Contact Us | " + urlPageTitle,
      description: "This is the contact page",
      init: initContact,
    },
    "/about": {
      template: "/about/about.html",
      title: "About Us | " + urlPageTitle,
      description: "This is the about page",
      init: initAbout,
    },
  };

  // Create a function that watches the url and calls the urlLocationHandler
  const urlRoute = (url: string) => {
    window.history.pushState({}, "", url);
    urlLocationHandler();
  };

  // Create a function that handles the url location
  const urlLocationHandler = async () => {
    let location = window.location.pathname;
    if (location.length === 0) location = "/";

    const route = urlRoutes[location] || urlRoutes["404"];
    const contentDiv = document.getElementById("content");
    const updateContent = (html: string) => {
      const newContent = document.createElement("div");
      newContent.innerHTML = html;

      while (contentDiv?.firstChild) {
        contentDiv.removeChild(contentDiv.firstChild);
      }
      contentDiv?.appendChild(newContent);
    };

    if (pageCache[location]) {
      updateContent(pageCache[location]);
      if (route.init) route.init();
      return;
    }

    try {
      const templateKey = `./pages${route.template}`;
      let html = templates[templateKey];
      if (!html) {
        html = await fetch(`/src/pages${route.template}`).then((res) =>
          res.text()
        );
      }
      pageCache[location] = html; // Cache the page content
      updateContent(html);

      // Run the initialization function for the loaded page if it exists
      if (route.init) {
        route.init();
      }

      document.title = route.title;

      const descriptionElement = document.querySelector(
        'meta[name="description"]'
      );
      descriptionElement?.setAttribute("content", route.description);
      updateActiveNavLink();
    } catch (error) {
      console.error("Error loading the page:", error);
      contentDiv!.innerHTML = `<div style="height: 650px" class="d-flex justify-content-center align-items-center"><h2>Failed to load content.</h2></div>`;
    }
  };

  // Start Navbar logic
  // --------------------------------

  const updateActiveNavLink = () => {
    const location = window.location.pathname;
    const navLinks = document.querySelectorAll(".nav-link");
    navLinks.forEach((link) => {
      if (
        (link as HTMLAnchorElement).href.split("/").pop() ===
        location.split("/").pop()
      ) {
        link.classList.add("active");
      } else {
        link.classList.remove("active");
      }
      link.addEventListener("click", (e) => {
        navLinks.forEach((link) => {
          link.classList.remove("active");
        });
        console.log(e.target);
        (e.target as HTMLElement).classList.add("active");
      });
    });
  };

  // End Navbar logic
  // -------------------------------

  // Add an event listener to the window that watches for url changes
  window.onpopstate = urlLocationHandler;
    (window as any).route = urlRoute;
  
    // Call the urlLocationHandler function to handle the initial url
  urlLocationHandler();
}
