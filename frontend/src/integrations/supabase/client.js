export const supabase = {
  from: () => ({
    select: () => ({
      eq: () => ({
        maybeSingle: async () => ({
          data: null
        }),
        then: cb => cb({
          data: null,
          count: 0
        })
      }),
      then: cb => cb({
        data: null,
        count: 0
      })
    })
  }),
  auth: {
    getUser: async () => ({
      data: {
        user: null
      }
    })
  }
};