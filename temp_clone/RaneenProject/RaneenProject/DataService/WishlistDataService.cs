using RaneenProject.ViewModels;
using System.Diagnostics;
using System.Reflection;
using System.Runtime.Serialization.Json;
using Xamarin.Forms.Internals;

namespace RaneenProject.DataService
{
    /// <summary>
    /// Data service to load the data from json file.
    /// </summary>
    [Preserve(AllMembers = true)]
    public class WishlistDataService
    {
        #region fields

        private static WishlistDataService wishlistDataService;

        private WishlistPageViewModel wishlistViewModel;

        #endregion

        #region Constructor

        /// <summary>
        /// Creates an instance for the <see cref="WishlistDataService"/> class.
        /// </summary>
        private WishlistDataService()
        {
        }

        #endregion

        #region Properties

        /// <summary>
        /// Gets an instance of the <see cref="WishlistDataService"/>.
        /// </summary>
        public static WishlistDataService Instance => wishlistDataService ?? (wishlistDataService = new WishlistDataService());

        /// <summary>
        /// Gets or sets the value of wishlist page view model.
        /// </summary>
        public WishlistPageViewModel WishlistPageViewModel =>
            this.wishlistViewModel = PopulateData<WishlistPageViewModel>("ecommerce.json");

        #endregion

        #region Methods

        /// <summary>
        /// Populates the data for view model from json file.
        /// </summary>
        /// <typeparam name="T">Type of view model.</typeparam>
        /// <param name="fileName">Json file to fetch data.</param>
        /// <returns>Returns the view model object.</returns>
        private static T PopulateData<T>(string fileName)
        {
            var file = "RaneenProject.Data." + fileName;

            var assembly = typeof(App).GetTypeInfo().Assembly;

            T data;

            using (var stream = assembly.GetManifestResourceStream(file))
            {
                var serializer = new DataContractJsonSerializer(typeof(T));
                data = (T)serializer.ReadObject(stream);
            }
            return data;
        }

        #endregion
    }
}